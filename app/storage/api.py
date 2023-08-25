import os
import app.storage.file_engine as file_engine
import app.storage.sqlite_engine as sqlite_engine

STORAGE_ENGINE = os.environ.get("STORAGE_ENGINE", "file")


def build_node(title):
    match STORAGE_ENGINE:
        case "file":
            return file_engine.build_node(title)
        case "sqlite":
            return sqlite_engine.build_node(title)


def Graph():
    match STORAGE_ENGINE:
        case "file":
            return file_engine.Graph()
        case _:
            return


def subnode_by_uri(uri):
    match STORAGE_ENGINE:
        case "file":
            return file_engine.subnode_by_uri(uri)
        case _:
            return


def random_node():
    match STORAGE_ENGINE:
        case "file":
            return file_engine.random_node()
        case _:
            return


def all_journals():
    match STORAGE_ENGINE:
        case "file":
            return file_engine.all_journals()
        case _:
            return


def all_users():
    match STORAGE_ENGINE:
        case "file":
            return file_engine.all_users()
        case _:
            return


def User(username):
    match STORAGE_ENGINE:
        case "file":
            return file_engine.User(username)
        case _:
            return


def user_readmes(username):
    match STORAGE_ENGINE:
        case "file":
            return file_engine.user_readmes(username)
        case _:
            return


def subnodes_by_user(username, sort_by="mtime", mediatype=None, reverse=True):
    match STORAGE_ENGINE:
        case "file":
            return file_engine.subnodes_by_user(username, sort_by, mediatype, reverse)
        case _:
            return


def search_subnodes_by_user(query, username):
    match STORAGE_ENGINE:
        case "file":
            return file_engine.search_subnodes_by_user(query, username)
        case _:
            return


def latest(max):
    match STORAGE_ENGINE:
        case "file":
            return file_engine.latest(max)
        case _:
            return


def top():
    match STORAGE_ENGINE:
        case "file":
            return file_engine.top()
        case _:
            return


def stats():
    match STORAGE_ENGINE:
        case "file":
            return file_engine.stats()
        case _:
            return
