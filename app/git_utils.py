# Copyright 2025 Flancian
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import pygit2
import cachetools.func
import time
from flask import current_app
from . import util

# Cache up to 1024 file paths for 5 minutes. This is a critical optimization
# to prevent re-walking the git history for the same file multiple times in a request.
@cachetools.func.ttl_cache(maxsize=1024, ttl=300)
def get_mtime(file_path: str) -> (int, str):
    """
    Gets the most accurate modification time for a file.
    It tries to get the last commit time from Git first. If that fails,
    it falls back to the filesystem's mtime.

    Returns a tuple of (timestamp, source), where source is 'git' or 'fs'.
    """
    current_app.logger.debug(f"get_mtime: Processing path '{file_path}'.")
    try:
        # 1. Discover the repository for the given file path.
        repo_path = pygit2.discover_repository(os.path.dirname(file_path))
        if not repo_path:
            raise ValueError("File is not in a Git repository.")
        
        repo = pygit2.Repository(repo_path)
        if repo.is_empty:
            raise ValueError("Repository is empty.")

        # 2. Get the file's path relative to the repository root.
        relative_path = os.path.relpath(file_path, repo.workdir)

        # 3. Find the last commit that touched this path.
        # This is the library equivalent of `git log -1 -- <path>`
        commits = repo.walk(repo.head.target, pygit2.GIT_SORT_TIME)
        for commit in commits:
            if commit.tree:
                try:
                    # If the path is not in the current commit's tree, it can't have been modified.
                    if relative_path not in commit.tree:
                        continue
                    
                    # If there are no parents, it's the initial commit, so the file was created here.
                    if not commit.parents:
                        current_app.logger.debug(f"get_mtime: Found 'git' source for '{file_path}'.")
                        return (commit.commit_time, 'git')

                    # Compare the blob ID of the file in this commit and its parent.
                    parent_tree = commit.parents[0].tree
                    if relative_path not in parent_tree:
                        # File was added in this commit.
                        current_app.logger.debug(f"get_mtime: Found 'git' source for '{file_path}'.")
                        return (commit.commit_time, 'git')
                    
                    if commit.tree[relative_path].id != parent_tree[relative_path].id:
                        # File was modified in this commit.
                        current_app.logger.debug(f"get_mtime: Found 'git' source for '{file_path}'.")
                        return (commit.commit_time, 'git')

                except (KeyError, IndexError):
                    # KeyError can happen if the path doesn't exist in a tree.
                    # IndexError can happen if there are no parents.
                    continue
        
        # If we get here, the file might exist in the workdir but not be in the commit history yet.
        raise ValueError("Could not find a commit for this file in history.")

    except (ValueError, KeyError, pygit2.errors.Pygit2Error) as e:
        # This will catch:
        # - Not a git repo
        # - Empty repo
        # - File not found in history
        # - Other git errors
        # Fall back to filesystem mtime.
        try:
            fs_mtime = int(os.path.getmtime(file_path))
            current_app.logger.debug(f"get_mtime: Found 'fs' source for '{file_path}'.")
            return (fs_mtime, 'fs')
        except (FileNotFoundError, OSError):
            # If we can't even get the filesystem mtime, return now.
            current_app.logger.debug(f"get_mtime: Could not find file, returning current time for '{file_path}'.")
            return (int(time.time()), 'fs')

def discover_repos(path):
    """Walks a directory and finds all git repositories."""
    repos = set()
    if os.path.isdir(os.path.join(path, '.git')):
        repos.add(os.path.abspath(path))

    for root, dirs, _ in os.walk(path):
        if '.git' in dirs:
            repo_path = os.path.abspath(root)
            repos.add(repo_path)
    return list(repos)

def get_latest_changes_per_repo(agora_path, logger, max_commits=10, max_files_per_user=10):
    """
    Scans all git repositories in the Agora and returns a dictionary of the most
    recently modified files in the last `max_commits` commits, grouped by user.
    The returned list of users is sorted by the most recent change.
    """
    logger.info(f"Starting on-demand scan for latest changes (last {max_commits} commits, max {max_files_per_user} files per user).")
    repos = discover_repos(agora_path)
    latest_changes = {}

    for repo_path in repos:
        user = util.path_to_user(repo_path)
        if user == 'agora': # Skip the main agora repo if needed
            continue

        repo_changes = {}
        try:
            repo = pygit2.Repository(repo_path)
            if repo.is_empty:
                continue

            # Walk the last `max_commits` from HEAD
            walker = repo.walk(repo.head.target, pygit2.GIT_SORT_TIME)
            for i, commit in enumerate(walker):
                if i >= max_commits:
                    break

                if commit.parents:
                    diff = commit.tree.diff_to_tree(commit.parents[0].tree)
                else:
                    diff = commit.tree.diff_to_tree()

                for patch in diff:
                    file_path = patch.delta.new_file.path
                    
                    # Only record the most recent change for each file
                    if file_path not in repo_changes:
                        file_path_abs = os.path.join(repo.workdir, file_path)
                        uri = util.path_to_uri(file_path_abs, agora_path)
                        repo_changes[file_path] = {
                            'uri': uri,
                            'wikilink': util.path_to_wikilink(file_path_abs),
                            'mtime': commit.commit_time,
                            'user': user
                        }
            
            if repo_changes:
                # Sort the collected changes for this repo by time and cap the number of files
                sorted_changes = sorted(repo_changes.values(), key=lambda x: x['mtime'], reverse=True)
                latest_changes[user] = sorted_changes[:max_files_per_user]

        except (pygit2.errors.RepositoryError, KeyError, ValueError) as e:
            logger.warning(f"Could not process repository at {repo_path}: {e}")
            continue
    
    # Sort the users by the timestamp of their most recent change.
    # The first item in each user's list is their most recent change because we sorted them above.
    sorted_users = sorted(
        latest_changes.items(), 
        key=lambda item: item[1][0]['mtime'] if item[1] else 0, 
        reverse=True
    )

    logger.info(f"Finished on-demand scan. Found changes for {len(sorted_users)} users.")
    return sorted_users
