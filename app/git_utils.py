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
from flask import current_app

from .storage import sqlite_engine

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

def get_last_commit_for_file(repo, file_path_relative_to_repo):
    """Gets the last commit that touched a file."""
    try:
        # Walker starts from the latest commit.
        walker = repo.walk(repo.head.target, pygit2.GIT_SORT_TIME)
        for commit in walker:
            if commit.tree:
                try:
                    # Check if the file exists in the parent commit's tree
                    if commit.parents:
                        parent_tree = commit.parents[0].tree
                        if file_path_relative_to_repo in parent_tree:
                            # Compare blobs to see if the file changed in this commit
                            if parent_tree[file_path_relative_to_repo].id != commit.tree[file_path_relative_to_repo].id:
                                return commit
                        else:
                            # File was added in this commit
                            return commit
                    else:
                        # Initial commit
                        return commit
                except KeyError:
                    # File not in tree, continue walking
                    continue
        return None
    except (KeyError, ValueError):
        # KeyError: repo.head.target doesn't exist (empty repo)
        # ValueError: object not found - invalid reference
        return None


def update_all_git_mtimes():
    """
    Scans all git repositories in the Agora, finds the last commit time for each
    file, and updates the database.
    """
    current_app.logger.info("Starting git mtime update process.")
    agora_path = current_app.config["AGORA_PATH"]
    repos = discover_repos(agora_path)
    db = sqlite_engine.get_db()

    if not db:
        current_app.logger.error("Cannot get database connection for git mtime update.")
        return

    mtime_updates = []

    for repo_path in repos:
        try:
            repo = pygit2.Repository(repo_path)
            if repo.is_empty:
                continue
        except pygit2.errors.RepositoryError:
            current_app.logger.warning(f"Could not open repository at {repo_path}, skipping.")
            continue

        cursor = db.cursor()
        cursor.execute("SELECT last_commit_hash FROM git_repo_state WHERE repo_path = ?", (repo_path,))
        result = cursor.fetchone()
        last_known_hash = result[0] if result else None
        current_hash = str(repo.head.target)

        if last_known_hash == current_hash:
            current_app.logger.info(f"Repository at {repo_path} is unchanged (commit {current_hash[:7]}). Skipping.")
            continue

        current_app.logger.info(f"Repository at {repo_path} has changed. Old: {last_known_hash[:7] if last_known_hash else 'None'}, New: {current_hash[:7]}. Scanning files.")

        # Using a walker to go through all commits
        # This is still not the most efficient way, a better way would be to walk the tree.
        # But let's start with this.
        
        # A more efficient approach: walk the tree of the latest commit.
        # For each blob (file), get its last commit.
        
        index = repo.index
        index.read()
        
        for entry in index:
            file_path_abs = os.path.join(repo.workdir, entry.path)
            
            # This is still slow as it walks history for each file.
            # A truly fast way is complex. Let's see if this is acceptable first.
            commit = get_last_commit_for_file(repo, entry.path)

            if commit:
                git_mtime = commit.commit_time
                # The path stored in the DB is relative to the Agora root
                subnode_path = file_path_abs.replace(agora_path + '/', '')
                mtime_updates.append((git_mtime, subnode_path))

        # Update the state for this repo
        try:
            with db:
                db.execute(
                    "REPLACE INTO git_repo_state (repo_path, last_commit_hash) VALUES (?, ?)",
                    (repo_path, current_hash)
                )
        except sqlite3.OperationalError as e:
            current_app.logger.error(f"DB error updating git_repo_state for {repo_path}: {e}")


    if mtime_updates:
        current_app.logger.info(f"Updating git_mtime for {len(mtime_updates)} files.")
        try:
            with db:
                db.executemany(
                    "UPDATE subnodes SET git_mtime = ? WHERE path = ?",
                    mtime_updates
                )
        except sqlite3.OperationalError as e:
            current_app.logger.error(f"DB error during bulk git_mtime update: {e}")
    else:
        current_app.logger.info("No file mtimes to update.")

    current_app.logger.info("Finished git mtime update process.")
