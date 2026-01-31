
import os
import notebooklm
from pathlib import Path

def find_callers():
    lib_path = Path(notebooklm.__file__).parent
    print(f"Searching library at: {lib_path}")
    
    for root, dirs, files in os.walk(lib_path):
        for file in files:
            if file.endswith('.py'):
                path = Path(root) / file
                content = path.read_text(encoding='utf-8', errors='ignore')
                if 'from_storage' in content:
                    print(f"Found in {path.relative_to(lib_path)}")
                    # Print lines
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if 'from_storage' in line:
                            print(f"  {i+1}: {line.strip()}")

if __name__ == "__main__":
    find_callers()
