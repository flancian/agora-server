from model import subnodes_by_title


def test_subnodes_by_title():
    subnodes = subnodes_by_title("contract")
    for subnode in subnodes:
        assert subnode.title == "contract"
