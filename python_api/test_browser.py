import sys
import asyncio
from notebook_client import NotebookManager

async def test_browser_launch():
    print("Testing browser launch...")
    mgr = NotebookManager()
    try:
        await mgr._launch_browser(headless=True)
        print("\n✓ Browser launched successfully!")
        await mgr.context.close()
        await mgr.playwright.stop()
        return True
    except Exception as e:
        print(f"\n✗ Browser launch failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_browser_launch())
    sys.exit(0 if result else 1)
