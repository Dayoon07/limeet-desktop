@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

echo ==================================
echo   Limeet Desktop 설치 시작
echo ==================================
echo.

REM Node.js 확인
echo Node.js 버전 확인...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 Node.js를 설치하세요.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 버전: %NODE_VERSION%
echo.

REM npm 확인
echo npm 버전 확인...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm이 설치되어 있지 않습니다.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm 버전: %NPM_VERSION%
echo.

REM 기존 node_modules 확인
if exist "node_modules" (
    echo 기존 node_modules 폴더가 존재합니다.
    set /p CLEAN="삭제하고 새로 설치하시겠습니까? (y/n): "
    if /i "!CLEAN!"=="y" (
        echo node_modules 삭제 중...
        rd /s /q node_modules 2>nul
        del /f /q package-lock.json 2>nul
        echo ✅ 삭제 완료
    )
    echo.
)

REM 기본 의존성 설치
echo 1. 기본 의존성 설치 중...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ 의존성 설치 실패
    pause
    exit /b 1
)
echo ✅ 기본 의존성 설치 완료
echo.

REM Electron 설치
echo 2. Electron 설치 중...
call npm install electron@^28.0.0 --save-dev
if %ERRORLEVEL% neq 0 (
    echo ❌ Electron 설치 실패
    pause
    exit /b 1
)
echo ✅ Electron 설치 완료
echo.

REM Electron Builder 설치
echo 3. Electron Builder 설치 중...
call npm install electron-builder@^24.9.0 --save-dev
if %ERRORLEVEL% neq 0 (
    echo ❌ Electron Builder 설치 실패
    pause
    exit /b 1
)
echo ✅ Electron Builder 설치 완료
echo.

REM 필수 파일 확인
echo 4. 필수 파일 확인...
set MISSING_FILES=0

if exist "electron-main.js" (
    echo ✅ electron-main.js
) else (
    echo ❌ electron-main.js (없음)
    set /a MISSING_FILES+=1
)

if exist "electron-preload.js" (
    echo ✅ electron-preload.js
) else (
    echo ❌ electron-preload.js (없음)
    set /a MISSING_FILES+=1
)

if exist "public\js\electron-renderer.js" (
    echo ✅ public\js\electron-renderer.js
) else (
    echo ❌ public\js\electron-renderer.js (없음)
    set /a MISSING_FILES+=1
)

if exist "public\index.html" (
    echo ✅ public\index.html
) else (
    echo ❌ public\index.html (없음)
    set /a MISSING_FILES+=1
)

if exist "public\js\socket-script.js" (
    echo ✅ public\js\socket-script.js
) else (
    echo ❌ public\js\socket-script.js (없음)
    set /a MISSING_FILES+=1
)

if exist "server.js" (
    echo ✅ server.js
) else (
    echo ❌ server.js (없음)
    set /a MISSING_FILES+=1
)

echo.

if !MISSING_FILES! gtr 0 (
    echo ❌ !MISSING_FILES! 개의 파일이 누락되었습니다.
    echo 필요한 파일을 추가한 후 다시 실행하세요.
    pause
    exit /b 1
)

REM 아이콘 파일 확인
echo 5. 아이콘 파일 확인...
if exist "public\img\icon.ico" (
    echo ✅ icon.ico 존재
) else (
    echo ⚠️  icon.ico 파일이 없습니다.
    echo 빌드 시 기본 아이콘이 사용됩니다.
)
echo.

REM package.json 확인
echo 6. package.json 확인...
findstr /C:"\"main\": \"electron-main.js\"" package.json >nul
if %ERRORLEVEL% equ 0 (
    echo ✅ Electron main 설정 확인됨
) else (
    echo ❌ package.json에 Electron 설정이 없습니다.
    echo package.json을 업데이트하세요.
    pause
    exit /b 1
)
echo.

REM 설치 완료
echo ==================================
echo ✅ 설치가 완료되었습니다!
echo ==================================
echo.

REM 실행 방법 안내
echo 📌 실행 방법:
echo.
echo   개발 모드 실행:
echo   npm run electron
echo.
echo   Windows 빌드:
echo   npm run build-win
echo.
echo   빌드 파일 위치:
echo   dist\Limeet Setup 1.0.0.exe
echo.

REM 자동 실행 여부 확인
set /p RUN_NOW="지금 바로 실행하시겠습니까? (y/n): "
if /i "%RUN_NOW%"=="y" (
    echo.
    echo 🚀 Limeet Desktop 실행 중...
    call npm run electron
) else (
    echo.
    echo 나중에 'npm run electron' 명령으로 실행하세요.
    pause
)

endlocal