@echo off
title NCRB Digital Evidence Management System - National Portal
echo ===================================================
echo   NCRB Digital Evidence Management System (DMS)
echo   Ministry of Home Affairs - Women Safety Division
echo ===================================================
echo.
cd /d "%~dp0frontend"
echo Starting local application on http://localhost:3000 ...
echo.
npm.cmd run dev
pause
