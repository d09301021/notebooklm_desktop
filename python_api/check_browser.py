import os

browser_base = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ms-playwright')
print(f'Browser base: {browser_base}')
print(f'Exists: {os.path.exists(browser_base)}')

if os.path.exists(browser_base):
    chromium_dirs = [d for d in os.listdir(browser_base) if d.startswith('chromium-')]
    print(f'Chromium dirs: {chromium_dirs}')
    
    if chromium_dirs:
        chromium_path = os.path.join(browser_base, chromium_dirs[0])
        chrome_exe = os.path.join(chromium_path, 'chrome-win64', 'chrome.exe')
        print(f'Chromium path: {chromium_path}')
        print(f'Chrome exe: {chrome_exe}')
        print(f'Chrome exe exists: {os.path.exists(chrome_exe)}')
        
        # Check size
        if os.path.exists(chromium_path):
            total_size = 0
            for dirpath, dirnames, filenames in os.walk(chromium_path):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    if os.path.exists(fp):
                        total_size += os.path.getsize(fp)
            print(f'Total chromium size: {total_size / (1024*1024):.2f} MB')
