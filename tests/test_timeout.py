import subprocess
import time

print("Testing subprocess.run with timeout=1...")
start = time.time()
try:
    subprocess.run(["sleep", "5"], timeout=1)
    print("Failed: subprocess.run did not time out!")
except subprocess.TimeoutExpired:
    print(f"Success: subprocess.run timed out after {time.time() - start:.2f}s")
except Exception as e:
    print(f"Error: {e}")
