#!/usr/bin/env bash
# 智慧医养医生服务系统 - 一键启动 (macOS / Linux)
# 注意：项目内置的 Redis 是 Windows 版二进制，Mac/Linux 请自行安装 Redis：
#   macOS:  brew install redis && brew services start redis
#   Ubuntu: sudo apt install redis-server && sudo systemctl start redis
set -e
cd "$(dirname "$0")"

echo "============================================================"
echo "  智慧医养医生服务系统 - 一键启动 (macOS / Linux)"
echo "============================================================"

# 1. 检查 Java
if ! command -v java >/dev/null 2>&1; then
  echo "[错误] 未检测到 Java，请先安装 JDK 17+：https://adoptium.net/"
  exit 1
fi
echo "[1/3] Java 已就绪：$(java -version 2>&1 | head -1)"

# 2. 检查 Redis（Mac/Linux 需自行安装并启动）
if command -v redis-cli >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1; then
  echo "[2/3] Redis 已在运行 (端口 6379)"
else
  echo "[2/3] [警告] 未检测到运行中的 Redis。请先启动 Redis 再继续："
  echo "        macOS:  brew services start redis"
  echo "        Ubuntu: sudo systemctl start redis"
  echo ""
  read -r -p "  Redis 已启动？按回车继续，Ctrl+C 取消... " _
fi

# 3. 启动应用
echo "[3/3] 启动 Spring Boot 应用 (首次运行自动下载依赖)..."
echo ""
echo "  提示：请确保 MySQL 已启动，root 密码与 application.yml 一致 (默认 123456)。"
echo "        应用会自动建库、建表并灌入测试数据。访问：http://localhost:8080"
echo ""
chmod +x ./mvnw
./mvnw spring-boot:run
