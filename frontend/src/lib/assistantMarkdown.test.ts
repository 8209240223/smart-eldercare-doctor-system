import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAssistantMarkdown } from "./assistantMarkdown.ts";

test("normalizes compact ATX headings outside fenced code blocks", () => {
  const source = [
    "##二、重点健康事项",
    "### 已有空格的标题",
    "普通正文中的 #井号 保持不变",
    "```markdown",
    "##代码块内不修改",
    "```",
    "   ####四级标题",
  ].join("\n");

  assert.equal(
    normalizeAssistantMarkdown(source),
    [
      "## 二、重点健康事项",
      "### 已有空格的标题",
      "普通正文中的 #井号 保持不变",
      "```markdown",
      "##代码块内不修改",
      "```",
      "   #### 四级标题",
    ].join("\n"),
  );
});

test("does not treat seven hashes as a supported heading", () => {
  assert.equal(normalizeAssistantMarkdown("#######正文"), "#######正文");
});

test("repairs compact two-column tables emitted in one line", () => {
  const source = [
    "一、核心指标|指标|数值|",
    "|------|------|负责人老人总数|7|待处理预警|1|",
    "",
    "二、预警详情",
  ].join("\n");

  assert.equal(
    normalizeAssistantMarkdown(source),
    [
      "一、核心指标",
      "| 指标 | 数值 |",
      "| --- | --- |",
      "| 负责人老人总数 | 7 |",
      "| 待处理预警 | 1 |",
      "",
      "二、预警详情",
    ].join("\n"),
  );
});

test("does not rewrite pipe content inside fenced code", () => {
  const source = [
    "```markdown",
    "|指标|数值|",
    "|---|---|",
    "```",
  ].join("\n");

  assert.equal(normalizeAssistantMarkdown(source), source);
});
