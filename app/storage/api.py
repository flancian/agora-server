import os
import app.storage.file_engine as file_engine

STORAGE_ENGINE = os.environ.get("STORAGE_ENGINE", "file")


def build_node(title):
    match STORAGE_ENGINE:
        case "file":
            return file_engine.build_node(title)


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
