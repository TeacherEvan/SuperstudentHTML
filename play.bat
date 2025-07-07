@echo off
setlocal enabledelayedexpansion

:: Super Student Game Launcher - Windows Version
:: Created for easy demo and presentation use

echo.
echo ================================
echo 🎮 Super Student Game Launcher
echo ================================
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found! Are you in the correct directory?
    echo Please run this script from the Super Student game directory.
    pause
    exit /b 1
)

:: Check Node.js installation
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js found: !NODE_VERSION!

:: Check npm installation
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    echo Please install npm (usually comes with Node.js)
    pause
    exit /b 1
)

:: Clean up any existing processes
echo [INFO] Cleaning up any existing game processes...
taskkill /f /im node.exe >nul 2>&1

:: Install dependencies
echo [INFO] Installing dependencies...
npm install --silent
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully!

:: Start the development server
echo [INFO] Starting Super Student game server...
echo.
echo ================================
echo 🎮 Super Student Game is Ready!
echo ================================
echo Local Access: http://localhost:3000
echo ================================
echo.
echo 📋 Controls:
echo    • Mouse/Touch: Click on items to interact
echo    • Space: Pause/Resume game
echo    • R: Restart game (when paused/game over)
echo    • Escape: Pause game or return to menu
echo.
echo 🎯 Game Features:
echo    • Colors Level: Match colors and learn color names
echo    • Shapes Level: Identify and match geometric shapes
echo    • Alphabet Level: Learn letters and alphabet recognition
echo    • Numbers Level: Practice number recognition and counting
echo    • Case Level: Distinguish between uppercase and lowercase
echo    • Phonics Level: Learn letter sounds and pronunciation
echo.
echo 💡 Presentation Tips:
echo    • Use F11 for fullscreen mode in browser
echo    • Game auto-saves progress between levels
echo    • Works on touch devices and interactive whiteboards
echo    • Responsive design adapts to different screen sizes
echo.
echo 🚀 To stop the game: Press Ctrl+C
echo.

:: Auto-open browser
echo [INFO] Opening game in browser...
start http://localhost:3000

:: Start the server
npm run dev