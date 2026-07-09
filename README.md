# 智慧医养大数据公共服务平台 · 医生服务系统

> SpringBoot + Vue 3 + Element Plus + ECharts 的老年健康管理平台。

面向社区医生 / 护士的老年健康管理平台。后端 Spring Boot，前端 Vue 3 + Element Plus + ECharts 单页应用，采用「墨青 · 临床守护」深色视觉主题，签名元素为生命体征 ECG 律动。

---

## 一、技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 后端框架 | Spring Boot | 2.7.18 |
| ORM | MyBatis-Plus | 3.5.4 |
| 连接池 | Druid | 1.2.20 |
| 认证 | JWT (jjwt) | 0.9.1 |
| API 文档 | Knife4j | 3.0.3 |
| 前端 | Vue 3 · Element Plus · ECharts · Axios | CDN 引入，无需构建 |
| 数据库 | MySQL | 5.7+ / 8.0+ |
| 缓存 | Redis | Windows 版已内置 |
| 构建 | Maven | 已内置 Wrapper，免安装 |

---

## 二、环境配置要求（重点）

拉取项目后，**只有 2 样需要你自己安装并配置**：JDK 和 MySQL。
Maven 和 Redis 已随仓库提供，无需另装。逐项说明如下。

### 2.1 JDK（必须自备）

| 项目 | 要求 |
|------|------|
| 最低版本 | **JDK 17** |
| 推荐版本 | JDK 17 或 JDK 21（均已验证可用） |
| 下载地址 | <https://adoptium.net/>（选 Temurin 17 / 21） |

**安装后验证**（命令行执行）：

```bash
java -version
```

看到 `version "17"` 或 `"21"` 即可。若提示命令未找到，需把 JDK 的 `bin` 目录加入系统环境变量 `PATH`，并建议设置 `JAVA_HOME` 指向 JDK 安装目录。

### 2.2 MySQL（必须自备）

| 配置项 | 要求 / 默认值 |
|--------|--------------|
| 版本 | MySQL 5.7+ 或 8.0+ |
| 运行地址 | `localhost:3306` |
| 账号 | `root` |
| 密码 | `123456` |
| 数据库名 | `medical_doctor`（**无需手动创建**） |
| 字符集 | utf8mb4 |

> **关键**：应用配置了 `createDatabaseIfNotExist=true` 且 `sql.init.mode=always`，
> 首次启动会**自动创建数据库 `medical_doctor`、自动建表、自动灌入测试数据**，你无需手动执行任何 SQL。

**如果你的 MySQL root 密码不是 `123456`**：打开 [src/main/resources/application.yml](src/main/resources/application.yml)，修改第 15 行：

```yaml
spring:
  datasource:
    username: root
    password: 你的真实密码   # ← 改这里
```

**安装后验证**（命令行执行）：

```bash
mysql -u root -p        # 输入密码后能进入 mysql> 即正常
```

### 2.3 Redis（Windows 免装 / Mac·Linux 需装）

| 配置项 | 默认值 |
|--------|--------|
| 运行地址 | `localhost:6379` |
| 密码 | 无 |
| 数据库索引 | 0 |

- **Windows**：仓库已内置 Redis（目录 `Redis-8.8.0-Windows-x64-cygwin-with-Service/`），
  `start.bat` 会自动启动，**无需安装**。
- **macOS / Linux**：内置的是 Windows 二进制，用不了，需自行安装：
  ```bash
  # macOS
  brew install redis && brew services start redis
  # Ubuntu / Debian
  sudo apt install redis-server && sudo systemctl start redis
  ```

### 2.4 Maven（完全免装）

仓库已内置 **Maven Wrapper**（`mvnw` / `mvnw.cmd`）。首次运行时会自动下载对应版本的 Maven 和全部依赖，你**无需安装 Maven**。首次下载依赖耗时较长，属正常现象。

---

## 三、快速启动

### 方式一：一键脚本（推荐）

**Windows** —— 双击 `start.bat`，或在项目根目录执行：

```bat
start.bat
```

脚本自动完成：检查 Java → 启动内置 Redis → 下载依赖并启动应用。

**macOS / Linux** —— 先确认 Redis 已启动（见 2.3），再执行：

```bash
./start.sh
```

### 方式二：手动启动（任意平台）

```bash
# 第 1 步：启动 Redis
#   Windows: 双击 Redis-8.8.0-Windows-x64-cygwin-with-Service\redis-server.exe
#   Mac/Linux: brew services start redis  或  sudo systemctl start redis

# 第 2 步：启动应用（mvnw 自动下载 Maven 与依赖）
./mvnw spring-boot:run        # macOS / Linux
mvnw.cmd spring-boot:run      # Windows
```

启动成功的标志（控制台输出）：

```
Tomcat started on port(s): 8080 (http)
Started MedicalDoctorApplication in x.x seconds
```

### 启动前核对清单

| # | 检查项 | 验证方式 |
|---|--------|----------|
| 1 | JDK 17+ 已装 | `java -version` |
| 2 | MySQL 已启动，密码匹配 | `mysql -u root -p` |
| 3 | Redis 已启动 | Windows 内置自动起 / Mac·Linux `redis-cli ping` 返回 PONG |

---

## 四、访问系统

启动后浏览器打开：**<http://localhost:8080>**

| 地址 | 说明 |
|------|------|
| `http://localhost:8080` | 登录页 |
| `http://localhost:8080/druid` | Druid 连接池 / SQL 监控（登录 `admin` / `123456`） |

### 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| `admin` | `admin123` | 系统管理员 |
| `doctor01` | `doctor123` | 医生（张医生） |
| `doctor02` | `doctor123` | 医生（李医生） |
| `nurse01` | `nurse123` | 护士 |

> 登录需输入页面上的图形验证码，点击图片可刷新。

---

## 五、常见问题

**Q1：端口 8080 被占用**
```bash
# Windows：查占用并结束进程
netstat -ano | findstr :8080
taskkill /F /PID <上一步查到的PID>
```
或改端口启动：`mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--server.port=8088"`

**Q2：MySQL 连接失败 `Access denied` / `Communications link failure`**
1. 确认 MySQL 服务已启动（Windows：`services.msc` 找 MySQL；Mac：`brew services list`）
2. 确认 `application.yml` 里的密码与你本机 root 密码一致
3. 确认 MySQL 监听 3306：`netstat -ano | findstr :3306`

**Q3：首次启动很慢**
Maven Wrapper 正在下载 Maven 和依赖，属正常，耐心等待（取决于网速，可能几分钟）。

**Q4：登录后页面空白 / 样式不对**
浏览器按 `Ctrl+F5` 强制刷新清缓存；或在控制台执行 `localStorage.clear()` 后重新访问。

**Q5：Redis 连接失败**
确认 Redis 已启动并监听 6379。Windows 用内置的；Mac/Linux 执行 `redis-cli ping`，返回 `PONG` 即正常。

---

## 六、项目结构

```
├── src/main/java/com/medical/     # 后端源码（controller/service/mapper/entity）
├── src/main/resources/
│   ├── application.yml             # 应用配置（端口/数据库/Redis/JWT）
│   ├── db/                         # 自动执行的建表与测试数据 SQL
│   └── static/                     # 前端页面（登录页 + SPA 主应用 + app.js）
├── sql/                            # 数据库脚本备份
├── docs/                           # 需求/设计/数据库等文档
├── Redis-8.8.0-Windows-x64-.../    # 内置 Windows 版 Redis
├── mvnw / mvnw.cmd / .mvn/         # Maven Wrapper（免装 Maven）
├── start.bat / start.sh            # 一键启动脚本
└── pom.xml                         # Maven 项目配置
```

---

## 七、安全提示

仓库中的数据库密码为本地开发用弱密码（`123456`）。**若部署到真实/公网环境，请务必**：
- 改用强密码，并通过环境变量注入，而非硬编码进 `application.yml`
- 修改 JWT 密钥（`application.yml` 中 `jwt.secret`）
- 为 Redis 设置访问密码

