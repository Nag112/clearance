export function stripAnsi(text: string): string {
  return text.replace(
    // eslint-disable-next-line no-control-regex
    /\u001B\[[0-9;]*[A-Za-z]|\u001B\][^\u0007]*\u0007|\u001B[()].|\r/g,
    "",
  );
}

export function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n");
}

const PROGRESS =
  /^(?:\s*(?:Downloading|download:|Progress:|\[=+>|#+\]|\d+%|\s*\.\.\.\s*)[^\n]*)$/i;

export function dropProgressLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => !PROGRESS.test(line.trim()))
    .join("\n");
}

export function clean(text: string): string {
  return collapseBlankLines(stripAnsi(dropProgressLines(text))).trimEnd() + (text.endsWith("\n") ? "\n" : "");
}
