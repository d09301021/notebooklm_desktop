
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def get_source():
    auth = AuthTokens(cookies={"foo": "bar"}, csrf_token="abc", session_id="123")
    client = NotebookLMClient(auth=auth)
    try:
        print("Source of client.artifacts._download_url:")
        print(inspect.getsource(client.artifacts._download_url))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(get_source())
