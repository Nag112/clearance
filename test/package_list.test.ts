import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { packageListProcessor } from "../src/engine/processors/package_list";
import { withProcessor } from "./helpers";

describe("package_list processor", () => {
  it("collapses a successful npm install", () => {
    const text = Array.from({ length: 80 }, (_, i) => `added ${i} packages in 3s`).join("\n");
    const out = withProcessor(packageListProcessor).compress({ command: "npm install", text });
    assert.match(out.text, /Build succeeded/);
  });

  it("keeps npm ERR lines on failure", () => {
    const text = "npm ERR! code ERESOLVE\nnpm ERR! unable to resolve dependency tree\n";
    const out = withProcessor(packageListProcessor).compress({ command: "npm install", text, exitCode: 1 });
    assert.match(out.text, /ERESOLVE/);
  });
});
