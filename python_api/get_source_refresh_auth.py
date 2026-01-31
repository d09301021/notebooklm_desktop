
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

def get_source():
    try:
        print("Source of NotebookLMClient.refresh_auth:")
        print(inspect.getsource(NotebookLMClient.refresh_auth))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_source()
