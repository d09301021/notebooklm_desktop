
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

def get_source():
    try:
        source = inspect.getsource(NotebookLMClient.refresh_auth)
        lines = source.split('\n')
        print('\n'.join(lines[:40]))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_source()
