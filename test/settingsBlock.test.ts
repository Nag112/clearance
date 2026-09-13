import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applySettingsBlock, hasUnmanagedOverride, stripSettingsBlock } from "../src/vscode/settingsBlock";

describe("settings block", () => {
  it("inserts a marked Copilot override block", () => {
    const out = applySettingsBlock('{\n    "editor.fontSize": 14\n}\n', "http://127.0.0.1:8787");
    assert.match(out, /clearance:start/);
    assert.match(out, /overrideCapiUrl": "http:\/\/127.0.0.1:8787"/);
    assert.match(out, /chat\.proxy\.url": "http:\/\/127.0.0.1:8787"/);
    assert.match(out, /"editor.fontSize": 14/);
    assert.doesNotMatch(out, /terminalProfile/);
  });

  it("adds a Copilot chat terminal profile when wrap paths are provided", () => {
    const out = applySettingsBlock("{\n}\n", {
      proxyUrl: "http://127.0.0.1:8787",
      wrap: { shimDir: "/tmp/shims", nodePath: "/usr/bin/node", cliPath: "/tmp/cli.js" },
    });
    assert.match(out, /CLEARANCE_WRAP/);
    assert.match(out, /\/tmp\/shims/);
  });

  it("removes only the marked block", () => {
    const applied = applySettingsBlock('{\n    "editor.fontSize": 14\n}\n', "http://127.0.0.1:8787");
    const stripped = stripSettingsBlock(applied);
    assert.match(stripped, /editor.fontSize/);
    assert.doesNotMatch(stripped, /overrideCapiUrl/);
  });

  it("refuses unmanaged existing overrides", () => {
    const source = '{\n    "github.copilot.advanced.debug.overrideCapiUrl": "http://example"\n}\n';
    assert.equal(hasUnmanagedOverride(source), true);
    assert.throws(() => applySettingsBlock(source, "http://127.0.0.1:1"));
  });
});
