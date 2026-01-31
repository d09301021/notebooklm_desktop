
import notebooklm.rpc.types as types
import inspect

try:
    source = inspect.getsource(types)
    print(source)
except Exception as e:
    print(f"Error: {e}")
