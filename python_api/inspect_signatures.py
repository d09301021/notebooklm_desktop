
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def inspect_signatures():
    auth = AuthTokens(cookies={"foo": "bar"}, csrf_token="abc", session_id="123")
    client = NotebookLMClient(auth=auth)
    
    methods = [
        'download_report',
        'export',
        'export_report',
        'download_quiz',
        'download_flashcards'
    ]
    
    print("\n[Method Signatures]")
    for name in methods:
        try:
            method = getattr(client.artifacts, name)
            sig = inspect.signature(method)
            print(f"- {name}{sig}")
        except Exception as e:
            print(f"- {name}: Error Getting Signature: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_signatures())
