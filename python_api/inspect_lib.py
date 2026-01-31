
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def inspect_lib():
    print("Inspecting NotebookLMClient...")
    auth = AuthTokens(cookies={"foo": "bar"}, csrf_token="abc", session_id="123")
    client = NotebookLMClient(auth=auth)
    
    print("\n[Sources Methods]")
    for name, method in inspect.getmembers(client.sources):
        if not name.startswith("_"):
            print(f"- {name}")
            
    print("\n[Chat Methods]")
    for name, method in inspect.getmembers(client.chat):
        if not name.startswith("_"):
            print(f"- {name}")

    print("\n[Artifacts Methods]")
    for name, method in inspect.getmembers(client.artifacts):
        if not name.startswith("_"):
            print(f"- {name}")

if __name__ == "__main__":
    asyncio.run(inspect_lib())
