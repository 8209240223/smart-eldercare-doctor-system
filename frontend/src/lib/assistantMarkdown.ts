function pipeCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return [];
  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorLine(line: string): boolean {
  const cells = pipeCells(line);
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/u.test(cell));
}

function normalizeRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function expandCompactSeparator(line: string): string[] {
  const match = line.match(/\|(?:\s*:?-{3,}:?\s*\|){2,}/u);
  if (!match || match.index === undefined) return [line];
  const before = line.slice(0, match.index).trim();
  const separator = match[0].trim();
  const after = line.slice(match.index + match[0].length).trim();
  return [before, separator, after].filter(Boolean);
}

function expandCompactTableLines(lines: string[]): string[] {
  const expanded: string[] = [];
  let insideFence = false;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (/^(```|~~~)/.test(trimmed)) {
      insideFence = !insideFence;
      expanded.push(line);
    } else if (insideFence) {
      expanded.push(line);
    } else {
      expanded.push(...expandCompactSeparator(line));
    }
  }
  return expanded;
}

function normalizeTableRows(lines: string[]): string[] {
  const normalized: string[] = [];
  let tableColumns = 0;
  let insideFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trimStart();
    if (/^(```|~~~)/.test(trimmed)) {
      insideFence = !insideFence;
      normalized.push(line);
      continue;
    }
    if (insideFence) {
      normalized.push(line);
      continue;
    }

    if (tableColumns === 0 && index + 1 < lines.length && isSeparatorLine(lines[index + 1])) {
      const separatorCells = pipeCells(lines[index + 1]);
      const headerCells = pipeCells(line);
      const cells = headerCells.length === separatorCells.length + 1 && !line.trimStart().startsWith("|")
        ? headerCells.slice(1)
        : headerCells;
      if (cells.length === separatorCells.length) {
        if (headerCells.length === separatorCells.length + 1) {
          normalized.push(headerCells[0]);
        }
        normalized.push(normalizeRow(cells));
        normalized.push(normalizeRow(separatorCells.map(() => "---")));
        tableColumns = separatorCells.length;
        index += 1;
        continue;
      }
    }

    if (tableColumns > 0) {
      if (!line.trim() || pipeCells(line).length === 0) {
        tableColumns = 0;
        normalized.push(line);
        continue;
      }
      const cells = pipeCells(line);
      if (cells.length >= tableColumns && cells.length % tableColumns === 0) {
        for (let offset = 0; offset < cells.length; offset += tableColumns) {
          normalized.push(normalizeRow(cells.slice(offset, offset + tableColumns)));
        }
        continue;
      }
      tableColumns = 0;
    }

    normalized.push(line);
  }

  return normalized;
}

export function normalizeAssistantMarkdown(content: string): string {
  const lines = normalizeTableRows(expandCompactTableLines(content.split(/\r?\n/u)));
  let insideFence = false;

  return lines
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
