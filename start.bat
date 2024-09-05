@echo off

REM Check and install dependencies in the current folder
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
) else (
    echo Frontend dependencies already installed.
)

REM Check and install dependencies in the backend folder
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
) else (
    echo Backend dependencies already installed.
)

REM Start the backend server
start cmd /k "cd backend && node server.js"

REM Wait for a moment to ensure the server has started
timeout /t 5

REM Start the frontend
start cmd /k "npm run dev"

echo Both server and frontend are now running.