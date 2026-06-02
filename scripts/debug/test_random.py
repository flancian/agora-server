import sys
import os
sys.path.append(os.path.abspath('app'))
from app import create_app
app = create_app()
with app.app_context():
    from app.storage import api
    for _ in range(10):
        print(api.random_node())
