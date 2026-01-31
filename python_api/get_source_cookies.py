
import asyncio
import notebooklm
from notebooklm.auth import load_httpx_cookies
import inspect

def get_source():
    try:
        print("Source of load_httpx_cookies:")
        print(inspect.getsource(load_httpx_cookies))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_source()
