@echo off
title Push TRACE-X to GitHub
color 0A

echo ===================================================
echo       TRACE-X GitHub Upload Assistant
echo ===================================================
echo.
echo Repository: https://github.com/Aadityasingh08/TraceX.git
echo.

set GIT_EXE="%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe"

if not exist %GIT_EXE% (
    set GIT_EXE=git
)

echo Initializing remote...
%GIT_EXE% remote remove origin 2>nul
%GIT_EXE% remote add origin https://github.com/Aadityasingh08/TraceX.git
%GIT_EXE% branch -M main

echo.
echo ---------------------------------------------------
echo Select Push Method:
echo [1] Standard Push (Browser / Credential Popup)
echo [2] Push using Personal Access Token (PAT)
echo ---------------------------------------------------
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="2" (
    echo.
    set /p token="Enter your GitHub Personal Access Token (ghp_...): "
    %GIT_EXE% remote set-url origin https://!token!@github.com/Aadityasingh08/TraceX.git
    echo Pushing code to GitHub with Token...
    %GIT_EXE% push -u origin main
) else (
    echo.
    echo Pushing code to GitHub... (Please login in popup if prompted)
    %GIT_EXE% push -u origin main
)

echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo   SUCCESS! All files uploaded to GitHub!
    echo   Check your repo: https://github.com/Aadityasingh08/TraceX
    echo ===================================================
) else (
    echo.
    echo [!] Push failed or cancelled.
    echo If it asked for password, please use GitHub Personal Access Token instead.
)

echo.
pause
