@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo Saifur Rahman Portfolio - Local Startup
echo ==========================================
where py >nul 2>nul
if %errorlevel%==0 (set "PY=py -3") else (where python >nul 2>nul && set "PY=python")
if not defined PY (echo ERROR: Python was not found. Install Python 3.11+ from python.org and enable Add Python to PATH.& pause & exit /b 1)
if not exist ".venv\Scripts\python.exe" (
 echo Creating local virtual environment...
 %PY% -m venv .venv
 if errorlevel 1 (echo ERROR: Could not create virtual environment.& pause & exit /b 1)
)
echo Checking and installing pinned dependencies if needed...
".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r requirements.txt
if errorlevel 1 (echo ERROR: Dependency installation failed. Check internet and Python version.& pause & exit /b 1)
set "PORT=5000"
:find_port
".venv\Scripts\python.exe" -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',%PORT%)); s.close()" >nul 2>nul
if not errorlevel 1 goto port_found
set /a PORT+=1
if %PORT% LEQ 5010 goto find_port
echo ERROR: Ports 5000 through 5010 are in use. Free one and retry.
pause
exit /b 1
:port_found
if not "%PORT%"=="5000" echo Port 5000 is busy; using port %PORT% instead.
if not exist "instance\portfolio.sqlite3" echo First run: open http://127.0.0.1:%PORT%/studio to create your private admin account.
echo Starting local server at http://127.0.0.1:%PORT%
echo Use this exact address in your browser: http://127.0.0.1:%PORT%/
".venv\Scripts\python.exe" app.py
if errorlevel 1 (echo ERROR: App exited with an error. Read the message above.& pause & exit /b 1)
pause
