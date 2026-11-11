@echo off
:: Setup memory sync — roda uma vez no Windows
:: Cria symlink do .claude local apontando para repo/memory/

set REPO_DIR=%~dp0..
set MEMORY_SRC=%REPO_DIR%\memory

:: Descobrir o path hash do projeto no .claude
:: Formato: substitui \ por - e remove letra de drive+:
for /f "delims=" %%i in ('powershell -command "(Get-Item '%REPO_DIR%').FullName.Replace('\','-').Replace(':','').TrimStart('-')"') do set PROJECT_HASH=%%i

set CLAUDE_BASE=%USERPROFILE%\.claude\projects\-%PROJECT_HASH%
set CLAUDE_MEMORY=%CLAUDE_BASE%\memory

echo Repo: %REPO_DIR%
echo Claude memory path: %CLAUDE_MEMORY%

:: Cria pasta .claude se nao existir
if not exist "%CLAUDE_BASE%" mkdir "%CLAUDE_BASE%"

:: Remove memoria local se existir (faz backup primeiro)
if exist "%CLAUDE_MEMORY%" (
    echo Fazendo backup da memoria local...
    xcopy "%CLAUDE_MEMORY%" "%CLAUDE_MEMORY%_backup\" /E /I /Q
    rmdir /S /Q "%CLAUDE_MEMORY%"
)

:: Cria symlink
mklink /D "%CLAUDE_MEMORY%" "%MEMORY_SRC%"

echo.
echo Sincronizacao de memoria configurada!
echo Agora toda sessao no Mac e Windows vai compartilhar a mesma memoria via git.
pause
