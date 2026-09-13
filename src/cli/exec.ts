import { spawnSync } from "node:child_process";
import path from "node:path";
import { createDefaultEngine } from "../engine";

const INTERACTIVE = new Set([
  "vi",
  "vim",
  "nvim",
  "nano",
  "emacs",
  "less",
  "more",
  "man",
  "top",
  "htop",
  "ssh",
  "scp",
  "sftp",
  "tmux",
  "screen",
  "gdb",
  "lldb",
  "psql",
  "mysql",
  "sqlite3",
]);

export function shouldPassThrough(argv: string[]): boolean {
  const bin = path.basename(argv[0] ?? "").replace(/\.exe$/i, "");
  if (INTERACTIVE.has(bin)) {
    return true;
  }
  if (bin === "git" && argv.includes("-i") && argv.some((a) => a === "rebase" || a === "add")) {
    return true;
  }
  if (bin === "git" && argv[1] === "commit" && !argv.includes("-m") && !argv.includes("-F")) {
    return true;
  }
  return false;
}

export function pathWithoutDir(envPath: string, dir: string): string {
  const delim = path.delimiter;
  const resolved = path.resolve(dir);
  return envPath
    .split(delim)
    .filter((entry) => entry.length > 0 && path.resolve(entry) !== resolved)
    .join(delim);
}

export interface ExecResult {
  status: number;
  stdout: string;
  compressed: boolean;
}

export function execCompressed(argv: string[], env: NodeJS.ProcessEnv = process.env): ExecResult {
  if (argv.length === 0) {
    return { status: 1, stdout: "", compressed: false };
  }
  const shimDir = env.CLEARANCE_SHIM_DIR;
  const childEnv: NodeJS.ProcessEnv = { ...env, CLEARANCE_EXEC_INNER: "1" };
  if (shimDir && childEnv.PATH) {
    childEnv.PATH = pathWithoutDir(childEnv.PATH, shimDir);
  }
  if (shouldPassThrough(argv) || env.CLEARANCE_WRAP !== "1") {
    const result = spawnSync(argv[0], argv.slice(1), { env: childEnv, stdio: "inherit" });
    return { status: result.status ?? (result.error ? 1 : 0), stdout: "", compressed: false };
  }
  const result = spawnSync(argv[0], argv.slice(1), {
    env: childEnv,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const combined = [result.stdout ?? "", result.stderr ?? ""].filter((s) => s.length > 0).join("\n");
  const status = result.status ?? (result.error ? 1 : 0);
  const compressed = createDefaultEngine().compress({
    command: argv.join(" "),
    text: combined,
    exitCode: status,
  });
  return { status, stdout: compressed.text, compressed: compressed.text !== combined };
}
