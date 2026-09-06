@echo off
title Stop NCRB Evidence Vault
echo Stopping NCRB Evidence Vault on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
echo Done. Application is completely turned off.
timeout /t 3
