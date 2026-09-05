@echo off
title TRACE-X GitHub Auto-Uploader
color 0B

echo ===================================================================
echo               TRACE-X AUTOMATED GITHUB UPLOADER
echo ===================================================================
echo.
echo Target Repository: https://github.com/Aadityasingh08/TraceX
echo.

set GH_EXE="%LOCALAPPDATA%\Programs\gh-cli\bin\gh.exe"
set GIT_EXE="%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe"

echo [Step 1/3] Logging into GitHub via Browser...
echo A browser window will open. Click 'Authorize' or enter the code shown below.
echo.

%GH_EXE% auth login --web -h github.com -p https

echo.
echo [Step 2/3] Configuring Git Credentials...
%GH_EXE% auth setup-git

echo.
echo [Step 3/3] Uploading all project files to Aadityasingh08/TraceX...
%GIT_EXE% remote remove origin 2>nul
%GIT_EXE% remote add origin https://github.com/Aadityasingh08/TraceX.git
%GIT_EXE% branch -M main
%GIT_EXE% push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================================
    echo   [SUCCESS] All files uploaded successfully!
    echo   Check your GitHub: https://github.com/Aadityasingh08/TraceX
    echo ===================================================================
) else (
    echo [!] Push encountered an issue. Please make sure login was approved.
)

echo.
pause
