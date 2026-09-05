import subprocess
import sys

git_exe = r"C:\Users\HP\AppData\Local\Programs\MinGit\cmd\git.exe"
cwd = r"c:\Users\HP\OneDrive\Desktop\TraceX-main (3)\TraceX-main"

def try_push():
    # Set remote
    subprocess.run([git_exe, "remote", "remove", "origin"], cwd=cwd, capture_output=True)
    subprocess.run([git_exe, "remote", "add", "origin", "https://github.com/Aadityasingh08/TraceX.git"], cwd=cwd, capture_output=True)
    
    # Try push with environment GIT_TERMINAL_PROMPT=0 so it fails immediately if not authenticated
    env = dict(subprocess.os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    
    res = subprocess.run([git_exe, "push", "-u", "origin", "main"], cwd=cwd, capture_output=True, text=True, env=env)
    print("Return code:", res.returncode)
    print("Stdout:", res.stdout)
    print("Stderr:", res.stderr)

try_push()
