
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def inspect_report():
    auth = AuthTokens(cookies={"foo": "bar"}, csrf_token="abc", session_id="123")
    client = NotebookLMClient(auth=auth)
    
    try:
        method = client.artifacts.generate_report
        sig = inspect.signature(method)
        print(f"generate_report{sig}")
    except Exception as e:
        print(f"Error Getting Signature: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_report())
