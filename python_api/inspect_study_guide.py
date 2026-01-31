
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def inspect_study_guide():
    auth = AuthTokens(cookies={"foo": "bar"}, csrf_token="abc", session_id="123")
    client = NotebookLMClient(auth=auth)
    
    try:
        method = client.artifacts.generate_study_guide
        sig = inspect.signature(method)
        print(f"generate_study_guide{sig}")
    except Exception as e:
        print(f"Error Getting Signature: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_study_guide())
