import requests
import time
import json

BASE_URL = "http://127.0.0.1:8000"

def test_task_flow():
    print("1. Checking Health...")
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Health: {r.status_code}, {r.text}")
    except Exception as e:
        print(f"Backend not reachable: {e}")
        return

    print("\n2. Listing Notebooks to get an ID...")
    try:
        r = requests.get(f"{BASE_URL}/api/notebooks")
        notebooks = r.json()
        if not notebooks:
            print("No notebooks found! Please create one manually in the UI if possible, or mocked.")
            # Mock a notebook ID if none found, strictly for testing task creation if logic allows
            notebook_id = "test-notebook-id"
        else:
            notebook_id = notebooks[0]['id']
            print(f"Using Notebook ID: {notebook_id}")
    except Exception as e:
        print(f"Failed to list notebooks: {e}")
        return

    print("\n3. Selecting Notebook (Important for manager context)...")
    requests.post(f"{BASE_URL}/api/select_notebook", json={"notebook_id": notebook_id})

    print("\n4. Checking Active Tasks (Should be empty)...")
    r = requests.get(f"{BASE_URL}/api/tasks/active")
    print(f"Active Tasks: {r.text}")

    print("\n5. Simulating a 'Chat Query' to trigger task creation...")
    # We send a stream query but just read the first chunk and verify task status immediately
    # Note: verify stream_query actually creates a task in app.py
    
    # Alternatively, use generate_slides which is simpler to hit and also tracked
    # But let's try chat first as that's what the user does.
    with requests.post(f"{BASE_URL}/api/stream_query", json={"prompt": "Hello"}, stream=True) as r:
        print("request sent...")
        time.sleep(1) # Give it a moment to register
        
        print("\n6. Checking Active Tasks AGAIN (Should show task)...")
        status_r = requests.get(f"{BASE_URL}/api/tasks/active")
        print(f"Active Tasks: {status_r.text}")
        
        # Consume a bit to ensure it runs
        for chunk in r.iter_content(chunk_size=1024):
            pass # drain

    print("\n7. Checking Active Tasks AFTER completion (Should be empty or show recent)...")
    status_r = requests.get(f"{BASE_URL}/api/tasks/active")
    print(f"Active Tasks: {status_r.text}")

if __name__ == "__main__":
    test_task_flow()
