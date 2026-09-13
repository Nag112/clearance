import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { testProcessor } from "../src/engine/processors/test";
import { withProcessor } from "./helpers";

describe("test processor", () => {
  it("collapses passing tests and keeps FAILED lines", () => {
    const passed = Array.from({ length: 30 }, (_, i) => `test_ok_${i} PASSED`);
    const text = [
      ...passed,
      "=================================== FAILURES ===================================",
      "__________________________ test_compression_ratio ______________________________",
      "E       AssertionError: boom",
      "FAILED tests/test_engine.py::test_compression_ratio - AssertionError: boom",
      "========================= 1 failed, 30 passed =========================",
    ].join("\n");
    const out = withProcessor(testProcessor).compress({ command: "pytest", text, exitCode: 1 });
    assert.match(out.text, /FAILED tests\/test_engine.py/);
    assert.match(out.text, /AssertionError: boom/);
    assert.ok(out.text.length < text.length);
  });
});
