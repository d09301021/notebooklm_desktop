
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def compare_signatures():
    auth = AuthTokens(cookies={"foo": "bar"}, csrf_token="abc", session_id="123")
    client = NotebookLMClient(auth=auth)
    
    methods = ['generate_study_guide', 'generate_audio', 'generate_quiz']
    
    for name in methods:
        try:
            method = getattr(client.artifacts, name)
            sig = inspect.signature(method)
            print(f"{name}{sig}")
        except Exception as e:
            print(f"{name}: Error: {e}")

if __name__ == "__main__":
    asyncio.run(compare_signatures())
