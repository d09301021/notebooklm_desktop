
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def inspect_quiz():
    auth = AuthTokens(cookies={"foo": "bar"}, csrf_token="abc", session_id="123")
    client = NotebookLMClient(auth=auth)
    
    try:
        from notebooklm.rpc.types import QuizDifficulty, QuizQuantity
        print(f"QuizDifficulty: {list(QuizDifficulty)}")
        print(f"QuizQuantity: {list(QuizQuantity)}")
    except Exception as e:
        print(f"Error importing enums: {e}")

    try:
        method = client.artifacts.generate_quiz
        sig = inspect.signature(method)
        print(f"generate_quiz signature: {sig}")
    except Exception as e:
        print(f"Error inspecting signature: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_quiz())
