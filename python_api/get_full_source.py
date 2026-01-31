
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

def get_source():
    try:
        source = inspect.getsource(NotebookLMClient.refresh_auth)
        # Split into blocks to avoid truncation in logs
        lines = source.split('\n')
        for i in range(0, len(lines), 50):
            print('\n'.join(lines[i:i+50]))
            print("--- CHUNK ---")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_source()
