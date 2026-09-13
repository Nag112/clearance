const ERROR_LINE =
  /\b(error|failed|failure|fatal|panic|traceback|exception|denied|refused)\b/i;

export function isErrorShaped(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }
  return ERROR_LINE.test(trimmed) || /^\s*E\s+\S/.test(trimmed) || /Error:/.test(trimmed);
}

export function recoverCriticalLines(
  original: string,
  compressed: string,
  maxLines: number,
): string {
  if (maxLines <= 0) {
    return compressed;
  }
  const kept = new Set(compressed.split("\n").map((l) => l.trim()));
  const missing = original.split("\n").filter((line) => isErrorShaped(line) && !kept.has(line.trim()));
  if (missing.length === 0) {
    return compressed;
  }
  const recovered = missing.slice(0, maxLines);
  const suffix = `\n[clearance] ${recovered.length} error line(s) recovered\n${recovered.join("\n")}\n`;
  return compressed.endsWith("\n") ? compressed + suffix.slice(1) : compressed + suffix;
}
