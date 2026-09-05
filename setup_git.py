import os
import urllib.request
import zipfile
import subprocess

local_app_data = os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))
dest_dir = os.path.join(local_app_data, "Programs", "MinGit")
os.makedirs(dest_dir, exist_ok=True)

git_exe = os.path.join(dest_dir, "cmd", "git.exe")

if not os.path.exists(git_exe):
    zip_url = "https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/MinGit-2.47.1-64-bit.zip"
    temp_zip = os.path.join(os.environ.get("TEMP", "."), "mingit.zip")
    
    print(f"Downloading MinGit from {zip_url}...")
    urllib.request.urlretrieve(zip_url, temp_zip)
    print("Extracting MinGit...")
    with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
        zip_ref.extractall(dest_dir)
    
    if os.path.exists(temp_zip):
        os.remove(temp_zip)

if os.path.exists(git_exe):
    print("MinGit successfully set up at:", git_exe)
    res = subprocess.run([git_exe, "--version"], capture_output=True, text=True)
    print("Git version:", res.stdout.strip())
else:
    print("Failed to find git.exe in:", dest_dir)
