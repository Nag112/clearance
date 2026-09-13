export function binaryName(command: string): string {
  const token = command.trim().split(/\s+/)[0] ?? "";
  return token.replace(/^.*[/\\]/, "").replace(/\.exe$/i, "");
}

export function commandIs(command: string, names: string[]): boolean {
  const bin = binaryName(command);
  return names.some((n) => bin === n || command.includes(`${n} `) || command.startsWith(`${n} `));
}

export function commandMatches(command: string, pattern: RegExp): boolean {
  return pattern.test(command.trim());
}

export function looksLikePath(command: string, exts: string[]): boolean {
  return exts.some((ext) => command.includes(ext));
}
