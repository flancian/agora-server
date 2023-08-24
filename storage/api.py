import os
import file

STORAGE_ENGINE = os.environ.get("STORAGE_ENGINE", "file")


def build_node(title):
    match STORAGE_ENGINE:
        case "file":
            return file.build_node(title)


print(build_node("testing"))
