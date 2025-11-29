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
import os
import subprocess
import cachetools.func
import time
from flask import current_app

# Cache up to 1024 file paths for 5 minutes. This is a critical optimization
# to prevent re-running the git command for the same file multiple times in a request.
@cachetools.func.ttl_cache(maxsize=1024, ttl=300)
def get_mtime(file_path: str) -> (int, str):
    """
    Gets the most accurate modification time for a file by shelling out to git.
    It tries to get the last commit time from Git first. If that fails,
    it falls back to the filesystem's mtime.

    Returns a tuple of (timestamp, source), where source is 'git' or 'fs'.
    """
    try:
        # Use git log to get the timestamp of the last commit for the specific file.
        # This is the most direct and performant way to get this information.
        timestamp_str = subprocess.check_output(
            ['git', 'log', '-1', '--pretty=%ct', '--', os.path.basename(file_path)],
            cwd=os.path.dirname(file_path),
            stderr=subprocess.DEVNULL  # Suppress errors like "does not have any commits yet"
        ).strip().decode('utf-8')
        
        if timestamp_str:
            return (int(timestamp_str), 'git')
        else:
            # This can happen if a file is new and untracked.
            raise ValueError("Git returned empty timestamp.")

    except (subprocess.CalledProcessError, ValueError, FileNotFoundError) as e:
        # This will catch:
        # - Not a git repo (FileNotFoundError or CalledProcessError)
        # - File not in history (empty output -> ValueError)
        # - Other git errors
        # Fall back to filesystem mtime.
        try:
            fs_mtime = int(os.path.getmtime(file_path))
            return (fs_mtime, 'fs')
        except (FileNotFoundError, OSError):
            # If we can't even get the filesystem mtime, return now.
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

def get_latest_changes_per_repo(agora_path, logger, max_commits=20, max_files_per_user=10):
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
                
                # Stop early if we have enough files for this user.
                if len(repo_changes) >= max_files_per_user:
                    break
            
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
