
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def inspect_auth():
    print("Inspecting AuthTokens...")
    auth_members = inspect.getmembers(AuthTokens)
    for name, _ in auth_members:
        if not name.startswith("_"):
            print(f"- {name}")
            
    print("\nInspecting NotebookLMClient constructor...")
    print(inspect.signature(NotebookLMClient.__init__))

if __name__ == "__main__":
    asyncio.run(inspect_auth())
