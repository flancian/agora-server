import unittest
import os
import shutil
from app.node import Graph, Node

class TestGraph(unittest.TestCase):
    def setUp(self):
        """Set up a temporary directory and a graph for testing."""
        self.test_dir = 'test_datadir'
        os.makedirs(self.test_dir, exist_ok=True)
        with open(os.path.join(self.test_dir, 'foo'), 'w') as f:
            f.write('[[bar]]')
        with open(os.path.join(self.test_dir, 'bar'), 'w') as f:
            f.write('[[baz]]')
        self.graph = Graph(datadir=self.test_dir)

    def tearDown(self):
        """Remove the temporary directory."""
        shutil.rmtree(self.test_dir)

    def test_search_return_type(self):
        """
        Tests that graph.search() returns a list of Nodes.
        """
        results = self.graph.search('foo')
        self.assertIsInstance(results, list)
        for node in results:
            self.assertIsInstance(node, Node)

    def test_getitem_return_type(self):
        """
        Tests that graph[key] returns a Node.
        """
        node = self.graph['foo']
        self.assertIsInstance(node, Node)
        self.assertEqual(node.name, 'foo')

    def test_contains(self):
        """
        Tests that 'key' in graph returns a boolean.
        """
        self.assertTrue('foo' in self.graph)
        self.assertFalse('nonexistent' in self.graph)

if __name__ == '__main__':
    unittest.main()
