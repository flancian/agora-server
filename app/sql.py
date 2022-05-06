import sqlite3
con = sqlite3.connect('agora.db')
cur = con.cursor()

def subnodes(node):
		for row in cur.execute("SELECT * FROM subnodes WHERE node = ?", (node,))
			print(row)