export function keepLines(
  text: string,
  keep: (line: string, index: number, lines: string[]) => boolean,
  label = "line(s) omitted",
): string {
  const lines = text.split("\n");
  const kept: string[] = [];
  let omitted = 0;
  for (let i = 0; i < lines.length; i++) {
    if (keep(lines[i], i, lines)) {
      kept.push(lines[i]);
    } else {
      omitted += 1;
    }
  }
  if (omitted === 0) {
    return text;
  }
  const suffix = `[clearance] ${omitted} ${label}`;
  if (kept.length === 0) {
    return suffix + "\n";
  }
  const joined = kept.join("\n");
  return joined.endsWith("\n") ? `${joined}${suffix}\n` : `${joined}\n${suffix}\n`;
}

export function isErrorish(line: string): boolean {
  return /\b(error|failed|failure|fatal|panic|traceback|exception|denied)\b/i.test(line) || /Error:/.test(line);
}
