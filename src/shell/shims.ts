import fs from "node:fs";
import path from "node:path";

export const SHIM_BINS = [
  "git",
  "gh",
  "npm",
  "npx",
  "yarn",
  "pnpm",
  "bun",
  "pytest",
  "jest",
  "vitest",
  "mocha",
  "ruff",
  "eslint",
  "pip",
  "pip3",
  "uv",
  "poetry",
  "cargo",
  "go",
  "make",
  "cmake",
  "docker",
  "kubectl",
  "terraform",
  "tofu",
  "pulumi",
  "helm",
  "ansible",
  "ansible-playbook",
  "rg",
  "grep",
  "aws",
  "gcloud",
  "az",
  "mvn",
  "gradle",
  "curl",
  "wget",
  "nix",
  "mise",
  "just",
  "act",
  "jq",
  "yq",
  "tree",
  "find",
  "cdktf",
];

export function shimScript(bin: string): string {
  return `#!/bin/sh
bindir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
newpath=
oldIFS=$IFS
IFS=:
for p in $PATH; do
  [ "$p" = "$bindir" ] && continue
  if [ -z "$newpath" ]; then
    newpath=$p
  else
    newpath=$newpath:$p
  fi
done
IFS=$oldIFS
export PATH=$newpath
if [ "$CLEARANCE_WRAP" != "1" ] || [ -n "$CLEARANCE_EXEC_INNER" ]; then
  exec ${bin} "$@"
fi
export CLEARANCE_EXEC_INNER=1
export CLEARANCE_SHIM_DIR="$bindir"
exec "$CLEARANCE_NODE" "$CLEARANCE_CLI" exec -- ${bin} "$@"
`;
}

export function writeShimDirectory(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const bin of SHIM_BINS) {
    fs.writeFileSync(path.join(dir, bin), shimScript(bin), { mode: 0o755 });
  }
}
