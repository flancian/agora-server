import pytest
import tempfile
import os
import shutil
from app import create_app

@pytest.fixture
def test_agora():
    """
    Pytest fixture to set up a temporary Agora instance for testing.

    This fixture creates a temporary directory and populates it with a minimal
    set of files and directories to simulate a real Agora. It configures a
    Flask test application to use this temporary Agora.

    Yields:
        Flask: The configured Flask test application instance.
    """
    # 1. Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    agora_path = temp_dir

    # 2. Create a minimal Agora file structure
    user1_garden_path = os.path.join(agora_path, "garden", "user1")
    os.makedirs(user1_garden_path)

    # 3. Create some test subnode files
    with open(os.path.join(user1_garden_path, "foo.md"), "w") as f:
        f.write("This is foo, which links to [[bar]].")

    with open(os.path.join(user1_garden_path, "bar.md"), "w") as f:
        f.write("This is bar.")
    
    # Create a dummy sources.yaml
    with open(os.path.join(agora_path, "sources.yaml"), "w") as f:
        f.write("- target: garden/user1\n  url: http://example.com/user1\n")

    # 4. Configure the Flask app for testing
    app = create_app()
    app.config.update({
        "TESTING": True,
        "AGORA_PATH": agora_path,
        # Disable SQLite for these tests to focus on file-based logic
        "ENABLE_SQLITE": False,
    })

    # 5. Yield the app context and client
    with app.app_context():
        yield app.test_client()

    # 6. Teardown: clean up the temporary directory
    shutil.rmtree(temp_dir)
