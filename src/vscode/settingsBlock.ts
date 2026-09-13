export const START_MARKER = "// --- clearance:start ---";
export const END_MARKER = "// --- clearance:end ---";

const OVERRIDE_KEYS = [
  "github.copilot.advanced.debug.overrideCapiUrl",
  "github.copilot.advanced.debug.overrideProxyUrl",
];

export function userSettingsPath(home = process.env.HOME ?? "", app = process.env.CLEARANCE_VSCODE_APP ?? "Code"): string {
  if (process.platform === "darwin") {
    return `${home}/Library/Application Support/${app}/User/settings.json`;
  }
  if (process.platform === "win32") {
    const appdata = process.env.APPDATA ?? `${home}/AppData/Roaming`;
    return `${appdata}/${app}/User/settings.json`;
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? `${home}/.config`;
  return `${xdg}/${app}/User/settings.json`;
}

export function buildBlock(proxyUrl: string): string {
  return [
    START_MARKER,
    `    "github.copilot.advanced.debug.overrideCapiUrl": ${JSON.stringify(proxyUrl)},`,
    `    "github.copilot.advanced.debug.overrideProxyUrl": ${JSON.stringify(proxyUrl)}`,
    `    ${END_MARKER}`,
  ].join("\n");
}

export function applySettingsBlock(source: string, proxyUrl: string): string {
  if (hasUnmanagedOverride(source)) {
    throw new Error("Refusing to overwrite an unmanaged Copilot endpoint override. Remove it or use Clearance: Disable first.");
  }
  const next = stripSettingsBlock(source).replace(/\s*$/, "");
  const block = buildBlock(proxyUrl);
  if (next.trim() === "" || next.trim() === "{}" || next.trim() === "{") {
    return `{\n    ${block}\n}\n`;
  }
  const trimmed = next.trimEnd();
  if (!trimmed.endsWith("}")) {
    throw new Error("settings.json does not look like a JSON object");
  }
  const withoutBrace = trimmed.slice(0, -1).trimEnd().replace(/,$/, "");
  const needsComma = /"[^"]+"\s*:/.test(withoutBrace);
  const prefix = withoutBrace.endsWith("{") ? withoutBrace : `${withoutBrace}${needsComma ? "," : ""}`;
  return `${prefix}\n    ${block}\n}\n`;
}

export function stripSettingsBlock(source: string): string {
  const start = source.indexOf(START_MARKER);
  const end = source.indexOf(END_MARKER);
  if (start === -1 && end === -1) {
    return source;
  }
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Incomplete Clearance settings markers");
  }
  const before = source.slice(0, start).replace(/,\s*$/, "");
  const after = source.slice(end + END_MARKER.length);
  return (before + after).replace(/\n{3,}/g, "\n\n");
}

export function hasUnmanagedOverride(source: string): boolean {
  const stripped = (() => {
    try {
      return stripSettingsBlock(source);
    } catch {
      return source;
    }
  })();
  return OVERRIDE_KEYS.some((key) => stripped.includes(key));
}
