import asyncio
from notebook_client import manager

async def test_suggestions():
    # Test with the notebook ID from the logs
    notebook_id = "a05b70f2-b37a-4afb-8101-96cc3b2ae447"
    
    print(f"Testing get_suggested_questions for {notebook_id}")
    
    if not manager.client:
        print("Manager not authenticated, trying to connect...")
        # The manager should already be authenticated from app.py startup
        
    suggestions = await manager.get_suggested_questions(notebook_id)
    print(f"Result: {suggestions}")

if __name__ == "__main__":
    asyncio.run(test_suggestions())
