import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { execCompressed, pathWithoutDir, shouldPassThrough } from "../src/cli/exec";
import { writeShimDirectory } from "../src/shell/shims";

describe("clearance exec", () => {
  it("compresses pytest-like output and keeps the child exit code", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clearance-exec-"));
    const bin = path.join(dir, "pytest");
    const body = [
      "#!/bin/sh",
      'i=0',
      'while [ "$i" -lt 40 ]; do',
      '  echo "test_ok_$i PASSED"',
      '  i=$((i + 1))',
      "done",
      'echo "========================= 40 passed ========================="',
      "exit 7",
    ].join("\n");
    fs.writeFileSync(bin, body, { mode: 0o755 });
    const result = execCompressed(["pytest"], {
      ...process.env,
      PATH: `${dir}${path.delimiter}${process.env.PATH ?? ""}`,
      CLEARANCE_WRAP: "1",
    });
    assert.equal(result.status, 7);
    assert.match(result.stdout, /40 tests passed/);
    assert.ok(result.compressed);
  });

  it("does not wrap git commit without a message flag", () => {
    assert.equal(shouldPassThrough(["git", "commit"]), true);
    assert.equal(shouldPassThrough(["git", "commit", "-m", "ok"]), false);
    assert.equal(shouldPassThrough(["vim", "file"]), true);
  });

  it("strips the shim directory from PATH", () => {
    const stripped = pathWithoutDir(`/tmp/shims:/usr/bin:/tmp/shims`, "/tmp/shims");
    assert.equal(stripped, "/usr/bin");
  });

  it("writes executable shims that skip wrap without CLEARANCE_WRAP", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clearance-shims-"));
    writeShimDirectory(dir);
    const git = fs.readFileSync(path.join(dir, "git"), "utf8");
    assert.match(git, /CLEARANCE_WRAP/);
    assert.match(git, /exec git /);
  });
});
