import unittest
from app.node import Node

class TestNode(unittest.TestCase):
    def test_wikilinks_return_type(self):
        """
        Tests that node.wikilinks returns a list of strings.
        """
        node = Node('test', content='[[foo]] [[bar]]')
        self.assertIsInstance(node.wikilinks, list)
        for link in node.wikilinks:
            self.assertIsInstance(link, str)

    def test_backlinks_return_type(self):
        """
        Tests that node.backlinks returns a list of Nodes.
        This is a placeholder test, as backlinks are not yet implemented.
        """
        node = Node('test')
        self.assertIsInstance(node.backlinks, list)
        # Once implemented, we should also test that the list contains Node objects.
        # for link in node.backlinks:
        #     self.assertIsInstance(link, Node)

if __name__ == '__main__':
    unittest.main()
