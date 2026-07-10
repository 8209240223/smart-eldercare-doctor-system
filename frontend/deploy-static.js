#!/usr/bin/env node
/**
 * 将前端构建产物复制到 Spring Boot 的 static 目录
 * 用法：node deploy-static.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, "dist");
const targetDir = path.join(__dirname, "..", "src", "main", "resources", "static");

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      emptyDir(fullPath);
      fs.rmdirSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(sourceDir)) {
  console.error("❌ dist 目录不存在，请先运行 npm run build");
  process.exit(1);
}

console.log(`🧹 清空 ${targetDir}`);
emptyDir(targetDir);

console.log(`📦 复制构建产物到 ${targetDir}`);
copyDir(sourceDir, targetDir);

console.log("✅ 部署完成，访问 http://localhost:8080/");
