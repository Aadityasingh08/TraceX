import os
import subprocess

git_exe = r"C:\Users\HP\AppData\Local\Programs\MinGit\cmd\git.exe"
cwd = r"c:\Users\HP\OneDrive\Desktop\TraceX-main (3)\TraceX-main"

def run_git(args):
    cmd = [git_exe] + args
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    print(f"git {' '.join(args)} -> rc={res.returncode}")
    if res.stdout.strip():
        print("  Stdout:", res.stdout.strip())
    if res.stderr.strip():
        print("  Stderr:", res.stderr.strip())
    return res

# 1. Initialize git
run_git(["init"])

# 2. Config user name / email if not configured
run_git(["config", "user.name", "TraceX Developer"])
run_git(["config", "user.email", "developer@tracex.local"])

# 3. Add all files according to .gitignore
run_git(["add", "."])

# 4. Commit
run_git(["commit", "-m", "Initial commit: TRACE-X Intelligence Fusion Platform with Complete Documentation and Architecture Guide"])

# 5. Branch main
run_git(["branch", "-M", "main"])

# 6. Check status
run_git(["status"])
