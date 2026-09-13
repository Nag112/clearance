import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lintProcessor } from "../src/engine/processors/lint";
import { withProcessor } from "./helpers";

describe("lint processor", () => {
  it("groups ruff issues by rule", () => {
    const lines = Array.from({ length: 20 }, (_, i) => `src/f${i}.py:1:1: E501 Line too long`);
    lines.push("src/a.py:2:1: F401 unused");
    const text = lines.join("\n");
    const out = withProcessor(lintProcessor).compress({ command: "ruff check", text });
    assert.match(out.text, /E501/);
    assert.match(out.text, /F401/);
    assert.ok(out.text.length < text.length);
  });
});
