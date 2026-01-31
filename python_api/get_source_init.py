
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

def get_source():
    try:
        print("Source of NotebookLMClient.__init__:")
        print(inspect.getsource(NotebookLMClient.__init__))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_source()
