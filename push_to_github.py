import sys
import subprocess
import os

git_exe = r"C:\Users\HP\AppData\Local\Programs\MinGit\cmd\git.exe"
cwd = r"c:\Users\HP\OneDrive\Desktop\TraceX-main (3)\TraceX-main"

def push(repo_url):
    print(f"Adding remote origin: {repo_url}")
    subprocess.run([git_exe, "remote", "remove", "origin"], cwd=cwd, capture_output=True)
    subprocess.run([git_exe, "remote", "add", "origin", repo_url], cwd=cwd, check=True)
    subprocess.run([git_exe, "branch", "-M", "main"], cwd=cwd, check=True)
    print("Pushing code to GitHub...")
    res = subprocess.run([git_exe, "push", "-u", "origin", "main"], cwd=cwd)
    if res.returncode == 0:
        print("\nSUCCESS! Your code has been uploaded to GitHub successfully!")
    else:
        print("\nPush failed. Please make sure you are authenticated with GitHub.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        repo_url = sys.argv[1]
    else:
        repo_url = input("Enter your GitHub Repository URL (e.g., https://github.com/username/TraceX.git): ").strip()
    
    if repo_url:
        push(repo_url)
    else:
        print("No repository URL provided.")
