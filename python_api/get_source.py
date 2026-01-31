
import asyncio
from notebooklm.auth import AuthTokens
import inspect

def get_source():
    try:
        print("Source of AuthTokens.from_storage:")
        print(inspect.getsource(AuthTokens.from_storage))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_source()
