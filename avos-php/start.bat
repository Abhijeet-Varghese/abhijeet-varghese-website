@echo off
REM ============================================================
REM AV OS — one-command local start (Windows)
REM Requires: PHP 8.x on PATH, MySQL/MariaDB running (XAMPP/MAMP)
REM   start.bat            -> backend + agent watcher
REM   start.bat --no-watch -> skip the watcher
REM The public website is the static frontend (..\abhijeetvarghese), served as-is.
REM ============================================================
setlocal
cd /d "%~dp0"
set PORT=8092

echo ---- AV OS · plug-and-play --------------------------------
where php >nul 2>nul || (echo X PHP not found - install PHP 8.x and add it to PATH & pause & exit /b 1)

REM 1. provision the avos database + user (first run; MySQL must be running)
mysql -h 127.0.0.1 -u root -e "CREATE DATABASE IF NOT EXISTS avos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'avos'@'localhost' IDENTIFIED BY 'aV0s_d3v_9xKq2mN7'; GRANT ALL PRIVILEGES ON avos.* TO 'avos'@'localhost'; FLUSH PRIVILEGES;" 2>nul
if errorlevel 1 (
  echo X Could not provision database. Start MySQL (XAMPP/MAMP) first.
  pause & exit /b 1
)

REM 2. local config
if not exist config.local.php (
  echo . creating config.local.php from example...
  copy config.local.example.php config.local.php >nul
)

REM 3. first-run install (migrations + admin) or plain migrate
php -r "require 'includes/bootstrap.php'; exit(Database::one(\"SELECT COUNT(*) n FROM users\")['n'] > 0 ? 0 : 1);" 2>nul
if errorlevel 1 (
  echo . first run: installing schema + administrator account...
  php database\install.php --admin-email=admin@abhijeetvarghese.com --generate
) else (
  php database\migrate.php
)

REM 4. backend server
netstat -an | findstr ":%PORT% " >nul 2>nul
if errorlevel 1 (
  echo . starting backend on http://localhost:%PORT% ...
  start "AV OS backend" cmd /k "php -S 0.0.0.0:%PORT% router.php"
  timeout /t 1 >nul
) else (
  echo . backend already running on port %PORT%
)

REM 5. agent watcher (AI agents / integrations — no site publishing)
if /i not "%1"=="--no-watch" (
  echo . starting agent watcher...
  start "AV OS agents" /min cmd /c "loop: php backend\scripts\agent-runner.php >> storage\logs\agent-runner.log 2>&1 & timeout /t 60 >nul & goto loop"
)

echo ----------------------------------------------------------
echo   PUBLIC SITE   http://localhost:%PORT%/
echo   ADMIN         http://localhost:%PORT%/admin/login.php
echo   API STATUS    http://localhost:%PORT%/api/status
echo ----------------------------------------------------------
start http://localhost:%PORT%/
endlocal
