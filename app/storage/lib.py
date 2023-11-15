import os
from pathlib import Path
from app.storage.model import Subnode, session, User


def get_markdown_files(folder_path):
    markdown_files = []
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                with open(file_path, "r") as f:
                    file_content = f.read()
                markdown_files.append(
                    {
                        "file_path": file_path,
                        "file_name": file,
                        "file_content": file_content,
                    }
                )
    return markdown_files


def get_files_by_paths(paths):
    markdown_files = []
    for path in paths:
        if not path.endswith(".md"):
            continue
        with open(path, "r") as f:
            file_content = f.read()
        markdown_files.append(
            {
                "file_path": path,
                "file_name": os.path.basename(path),
                "file_content": file_content,
            }
        )
    return markdown_files


def markdown_files(users_folder):
    markdown_files_by_user = {}
    for user in os.listdir(users_folder):
        user_row = session.query(User).filter_by(name=user).first()

        user_folder = os.path.join(users_folder, user)
        if user_row and user_row.last_sha:
            new = changes(user_row.last_sha, user_folder)
            if len(new) > 0:
                markdown_files = get_files_by_paths(new)
                markdown_files_by_user[user] = markdown_files
                continue
        need_update = update_records(user, user_folder)
        if not need_update:
            continue
        if os.path.isdir(user_folder):
            markdown_files = get_markdown_files(user_folder)
            markdown_files_by_user[user] = markdown_files
    return markdown_files_by_user

    # def parse_pushes


import git


def update_records(name, user_folder):
    repo = git.Repo(user_folder, search_parent_directories=True)
    sha = repo.head.object.hexsha
    user = session.query(User).filter_by(name=name).first()
    if not user:
        user = User(name=name, last_sha=sha)
        session.add(user)
        return True
    if user.last_sha != sha:
        user.last_sha = sha
        return True
    return False


def changes(last_sha, user_folder):
    repo = git.Repo(user_folder, search_parent_directories=True)
    current_sha = repo.head.object.hexsha
    prev = repo.commit(last_sha)
    curr = repo.commit(current_sha)
    diff = prev.diff(curr)
    return [os.path.join(user_folder, change.a_path) for change in diff]


def update():
    users_folder = os.environ.get("GARDEN_FOLDER")

    markdown = markdown_files(users_folder)
    subnodes = []
    for user in markdown:
        files = markdown[user]
        for file in files:
            title = Path(file["file_path"]).stem
            subnode = Subnode(
                user=user,
                title=title,
                path=file["file_path"],
                body=file["file_content"],
            )
            # subnodes.append(subnode)
            found = (
                session.query(Subnode)
                .where(Subnode.user == user, Subnode.title == title)
                .first()
            )
            if found:
                found.body = file["file_content"]
                continue
            session.add(subnode)
    # session.bulk_save_objects(subnodes)

    session.commit()
