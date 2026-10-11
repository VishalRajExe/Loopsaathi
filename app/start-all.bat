@echo off
setlocal
set "ROOT=%~dp0"

echo LoopSaathi local launcher
echo MySQL must already be running on localhost:3306.
echo Spring uses the ignored backend\application-local.properties or SPRING_DATASOURCE_PASSWORD.

start "LoopSaathi Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%ROOT%backend'; mvn spring-boot:run"
start "LoopSaathi AI" powershell -NoExit -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Set-Location -LiteralPath '%ROOT%ai-service'; if (!(Test-Path -LiteralPath '.venv\Scripts\python.exe')) { py -3.13 -m venv .venv; & '.venv\Scripts\python.exe' -m pip install -r requirements.txt }; & '.venv\Scripts\python.exe' -m uvicorn main:app --host 127.0.0.1 --port 8000"
start "LoopSaathi Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Set-Location -LiteralPath '%ROOT%frontend'; if (!(Test-Path -LiteralPath 'node_modules\vite\bin\vite.js')) { npm install }; npm run dev -- --host 127.0.0.1 --port 5173"

endlocal
