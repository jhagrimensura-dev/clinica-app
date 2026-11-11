@echo off
:: Setup memory sync - roda uma vez no Windows
:: Cria junction do .claude local apontando para repo/memory/

for /f "delims=" %%i in ('powershell -NoProfile -command "(Get-Item '%~dp0..').FullName"') do set REPO_DIR=%%i
set MEMORY_SRC=%REPO_DIR%\memory

:: Formato do Claude: C:\Users\X\clinica-app -> C--Users-X-clinica-app
for /f "delims=" %%i in ('powershell -NoProfile -command "'%REPO_DIR%' -replace '[:\\]','-'"') do set PROJECT_HASH=%%i

set CLAUDE_BASE=%USERPROFILE%\.claude\projects\%PROJECT_HASH%
set CLAUDE_MEMORY=%CLAUDE_BASE%\memory

echo Repo: %REPO_DIR%
echo Claude memory path: %CLAUDE_MEMORY%

if not exist "%CLAUDE_BASE%" mkdir "%CLAUDE_BASE%"

:: Ja esta linkado? Sai sem mexer
powershell -NoProfile -command "if ((Get-Item '%CLAUDE_MEMORY%' -ErrorAction SilentlyContinue).LinkType) { exit 1 }"
if errorlevel 1 (
    echo Ja configurado.
    pause
    exit /b 0
)

if exist "%CLAUDE_MEMORY%" (
    echo Fazendo backup da memoria local...
    xcopy "%CLAUDE_MEMORY%" "%CLAUDE_MEMORY%_backup\" /E /I /Q
    rmdir /S /Q "%CLAUDE_MEMORY%"
)

:: Junction nao precisa de admin (mklink /D precisa)
mklink /J "%CLAUDE_MEMORY%" "%MEMORY_SRC%"

echo.
echo Sincronizacao de memoria configurada!
pause
