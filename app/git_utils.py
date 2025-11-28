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
import sqlite3

from . import util

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

def get_latest_changes_per_repo(agora_path, logger, max_commits=10):
    """
    Scans all git repositories in the Agora and returns a dictionary of the most
    recently modified files in the last `max_commits` commits, grouped by user.
    """
    logger.info(f"Starting on-demand scan for latest changes (last {max_commits} commits).")
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
                # Sort the collected changes for this repo by time before adding
                sorted_changes = sorted(repo_changes.values(), key=lambda x: x['mtime'], reverse=True)
                latest_changes[user] = sorted_changes

        except (pygit2.errors.RepositoryError, KeyError, ValueError) as e:
            logger.warning(f"Could not process repository at {repo_path}: {e}")
            continue
    
    logger.info(f"Finished on-demand scan. Found changes for {len(latest_changes)} users.")
    return latest_changes
