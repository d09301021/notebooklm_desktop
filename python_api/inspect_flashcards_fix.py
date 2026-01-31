
import asyncio
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens
import inspect

async def inspect_flashcards():
    auth = AuthTokens(cookies={"foo": "bar"}, csrf_token="abc", session_id="123")
    client = NotebookLMClient(auth=auth)
    
    try:
        # Check if there's a specific flashcard quantity enum or if it uses QuizQuantity
        from notebooklm.rpc.types import FlashcardQuantity, QuizQuantity
        print(f"FlashcardQuantity: {list(FlashcardQuantity) if 'FlashcardQuantity' in locals() else 'Not found'}")
    except Exception as e:
        print(f"Error importing FlashcardQuantity: {e}")

    try:
        method = client.artifacts.generate_flashcards
        sig = inspect.signature(method)
        print(f"generate_flashcards signature: {sig}")
    except Exception as e:
        print(f"Error inspecting signature: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_flashcards())
