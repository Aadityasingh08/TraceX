import os
import urllib.request
import zipfile
import subprocess

dest_dir = os.path.join(os.environ.get("LOCALAPPDATA", "."), "Programs", "gh-cli")
os.makedirs(dest_dir, exist_ok=True)
gh_exe = os.path.join(dest_dir, "bin", "gh.exe")

if not os.path.exists(gh_exe):
    # GitHub CLI portable zip
    zip_url = "https://github.com/cli/cli/releases/download/v2.67.0/gh_2.67.0_windows_amd64.zip"
    temp_zip = os.path.join(os.environ.get("TEMP", "."), "gh.zip")
    print("Downloading GitHub CLI...")
    urllib.request.urlretrieve(zip_url, temp_zip)
    print("Extracting GitHub CLI...")
    with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
        zip_ref.extractall(dest_dir)
    
    # move files if extracted inside a subfolder
    subfolders = [f for f in os.listdir(dest_dir) if os.path.isdir(os.path.join(dest_dir, f)) and f.startswith("gh_")]
    if subfolders:
        extracted_folder = os.path.join(dest_dir, subfolders[0])
        bin_dir = os.path.join(dest_dir, "bin")
        os.makedirs(bin_dir, exist_ok=True)
        src_gh = os.path.join(extracted_folder, "bin", "gh.exe")
        if os.path.exists(src_gh):
            import shutil
            shutil.copy2(src_gh, gh_exe)

    if os.path.exists(temp_zip):
        os.remove(temp_zip)

if os.path.exists(gh_exe):
    print("gh.exe successfully ready at:", gh_exe)
    res = subprocess.run([gh_exe, "--version"], capture_output=True, text=True)
    print("Version:", res.stdout.strip())
else:
    print("Failed to setup gh.exe")
