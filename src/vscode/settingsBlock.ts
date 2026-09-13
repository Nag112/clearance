export const START_MARKER = "// --- clearance:start ---";
export const END_MARKER = "// --- clearance:end ---";

const OVERRIDE_KEYS = [
  "github.copilot.advanced.debug.overrideCapiUrl",
  "github.copilot.advanced.debug.overrideProxyUrl",
  "github.copilot.chat.proxy.url",
  "terminal.chat.tools.terminalProfile.",
];

export interface SettingsWrapOptions {
  shimDir: string;
  nodePath: string;
  cliPath: string;
}

export interface SettingsApplyOptions {
  proxyUrl: string;
  wrap?: SettingsWrapOptions;
}

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

export function chatProfileKey(platform = process.platform): string {
  if (platform === "win32") {
    return "terminal.chat.tools.terminalProfile.windows";
  }
  if (platform === "darwin") {
    return "terminal.chat.tools.terminalProfile.osx";
  }
  return "terminal.chat.tools.terminalProfile.linux";
}

export function defaultShellPath(platform = process.platform, env: NodeJS.ProcessEnv = process.env): string {
  if (platform === "win32") {
    return env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe";
  }
  return env.SHELL || (platform === "darwin" ? "/bin/zsh" : "/bin/bash");
}

export function buildBlock(opts: SettingsApplyOptions, platform = process.platform, env: NodeJS.ProcessEnv = process.env): string {
  const lines = [
    START_MARKER,
    `    "github.copilot.advanced.debug.overrideCapiUrl": ${JSON.stringify(opts.proxyUrl)},`,
    `    "github.copilot.advanced.debug.overrideProxyUrl": ${JSON.stringify(opts.proxyUrl)},`,
    `    "github.copilot.chat.proxy.url": ${JSON.stringify(opts.proxyUrl)}`,
  ];
  if (opts.wrap) {
    const sep = platform === "win32" ? ";" : ":";
    const existingPath = env.PATH ?? "";
    const profile = {
      path: defaultShellPath(platform, env),
      env: {
        CLEARANCE_WRAP: "1",
        CLEARANCE_SHIM_DIR: opts.wrap.shimDir,
        CLEARANCE_NODE: opts.wrap.nodePath,
        CLEARANCE_CLI: opts.wrap.cliPath,
        PATH: `${opts.wrap.shimDir}${sep}${existingPath}`,
      },
    };
    lines[lines.length - 1] += ",";
    lines.push(`    ${JSON.stringify(chatProfileKey(platform))}: ${JSON.stringify(profile)}`);
  }
  lines.push(`    ${END_MARKER}`);
  return lines.join("\n");
}

function normalizeApplyOptions(proxyUrlOrOpts: string | SettingsApplyOptions): SettingsApplyOptions {
  return typeof proxyUrlOrOpts === "string" ? { proxyUrl: proxyUrlOrOpts } : proxyUrlOrOpts;
}

export function applySettingsBlock(source: string, proxyUrlOrOpts: string | SettingsApplyOptions): string {
  const opts = normalizeApplyOptions(proxyUrlOrOpts);
  if (hasUnmanagedOverride(source)) {
    throw new Error("Refusing to overwrite an unmanaged Copilot endpoint override. Remove it or use Clearance: Disable first.");
  }
  const next = stripSettingsBlock(source).replace(/\s*$/, "");
  const block = buildBlock(opts);
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
