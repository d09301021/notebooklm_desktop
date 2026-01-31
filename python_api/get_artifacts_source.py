
import os
import notebooklm
from pathlib import Path

def get_source():
    lib_path = Path(notebooklm.__file__).parent
    path = lib_path / "_artifacts.py"
    if path.exists():
        content = path.read_text(encoding='utf-8', errors='ignore')
        # Print only lines with from_storage
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'from_storage' in line:
                print(f"{i+1}: {line.strip()}")
                # Print 5 lines around it
                start = max(0, i-2)
                end = min(len(lines), i+3)
                for j in range(start, end):
                    print(f"  {j+1}: {lines[j]}")

if __name__ == "__main__":
    get_source()
