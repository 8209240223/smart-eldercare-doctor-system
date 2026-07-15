export function normalizeAssistantMarkdown(content: string): string {
  let insideFence = false;

  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trimStart();
      if (/^(```|~~~)/.test(trimmed)) {
        insideFence = !insideFence;
        return line;
      }
      if (insideFence) return line;
      return line.replace(/^(\s{0,3}#{1,6})([^\s#])/u, "$1 $2");
    })
    .join("\n");
}
