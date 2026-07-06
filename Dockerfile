# ---------- 构建阶段：编译并打包成可执行 jar ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# 先拷 pom 单独下依赖，利用 Docker 层缓存（依赖不变则不重复下载）
COPY pom.xml .
# 使用阿里云镜像加速国内构建
RUN mkdir -p /root/.m2 && \
    printf '<settings><mirrors><mirror><id>aliyun</id><mirrorOf>central</mirrorOf><url>https://maven.aliyun.com/repository/central</url></mirror></mirrors></settings>' > /root/.m2/settings.xml && \
    mvn -B -q dependency:go-offline || true

# 拷源码并打包（跳过测试加快构建）
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---------- 运行阶段：精简 JRE 镜像 ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# 时区设为上海（与应用配置一致）
ENV TZ=Asia/Shanghai

# 仅拷贝构建产物 jar
COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

# 支持通过环境变量注入 JVM 参数
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
