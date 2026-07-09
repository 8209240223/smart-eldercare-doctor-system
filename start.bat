@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================================
echo   智慧医养医生服务系统 - 一键启动 (Windows)
echo ============================================================
echo.

REM ---------- 1. 检查 Java ----------
where java >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Java，请先安装 JDK 17 或更高版本。
    echo        下载: https://adoptium.net/
    pause
    exit /b 1
)
echo [1/3] Java 已就绪
for /f "tokens=*" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do echo       %%v

REM ---------- 2. 启动内置 Redis ----------
echo [2/3] 启动内置 Redis (端口 6379)...
tasklist /fi "imagename eq redis-server.exe" 2>nul | find /i "redis-server.exe" >nul
if errorlevel 1 (
    start "Redis Server" /min "%~dp0Redis-8.8.0-Windows-x64-cygwin-with-Service\redis-server.exe" "%~dp0Redis-8.8.0-Windows-x64-cygwin-with-Service\redis.conf"
    echo       Redis 已启动
) else (
    echo       Redis 已在运行，跳过
)

REM ---------- 3. 启动应用 (Maven Wrapper 自动下载 Maven) ----------
echo [3/3] 启动 Spring Boot 应用 (首次运行会自动下载依赖，请耐心等待)...
echo.
echo   提示: 请确保 MySQL 已启动，且 root 密码与 application.yml 一致 (默认 123456)。
echo         应用启动后会自动建库、建表并灌入测试数据。
echo         访问地址: http://localhost:8080
echo.
call mvnw.cmd spring-boot:run

endlocal
