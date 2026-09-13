import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CompressionEngine } from "../src/engine/engine";
import { genericProcessor } from "../src/engine/processors/generic";
import type { Processor } from "../src/engine/processor";

describe("CompressionEngine pipeline", () => {
  it("skips tiny outputs", () => {
    const engine = new CompressionEngine();
    const text = "short";
    const out = engine.compress({ command: "echo", text });
    assert.equal(out.text, text);
    assert.equal(out.skipped, true);
  });

  it("caps huge outputs with a marker", () => {
    const engine = new CompressionEngine({
      minInputLength: 1,
      maxOutputBytes: 20,
      minCompressionRatio: 0,
      recoverCriticalLines: 0,
    });
    const text = "abcdefghij".repeat(10);
    const out = engine.compress({ command: "cat", text });
    assert.match(out.text, /\[clearance\] truncated/);
    assert.ok(out.bytesOut < out.bytesIn || out.text.includes("truncated"));
  });

  it("uses first matching processor", () => {
    const first: Processor = {
      name: "first",
      canHandle: () => true,
      process: (i) => ({ text: i.text.slice(10) }),
    };
    const second: Processor = {
      name: "second",
      canHandle: () => true,
      process: (i) => ({ text: `SECOND:${i.text}` }),
    };
    const engine = new CompressionEngine({
      minInputLength: 1,
      maxOutputBytes: 1_000_000,
      minCompressionRatio: 0,
      recoverCriticalLines: 0,
    });
    engine.register(first).register(second);
    const pad = "x".repeat(80);
    const out = engine.compress({ command: "x", text: pad });
    assert.equal(out.processor, "first");
    assert.equal(out.text, pad.slice(10));
  });

  it("routes non-zero exit to generic unless handlesFailure", () => {
    const specialist: Processor = {
      name: "special",
      handlesFailure: false,
      canHandle: (i) => i.command.startsWith("pytest"),
      process: () => ({ text: "dropped everything" }),
    };
    const engine = new CompressionEngine({
      minInputLength: 1,
      maxOutputBytes: 1_000_000,
      minCompressionRatio: 0,
      recoverCriticalLines: 0,
    });
    engine.register(specialist).register(genericProcessor);
    const text = "FAILED tests/test_foo.py::test_bar - AssertionError: boom\n" + "n".repeat(80);
    const out = engine.compress({ command: "pytest", text, exitCode: 1 });
    assert.equal(out.processor, "generic");
    assert.match(out.text, /FAILED/);
  });

  it("recovers vanished error lines", () => {
    const dropper: Processor = {
      name: "dropper",
      handlesFailure: true,
      canHandle: () => true,
      process: () => ({ text: "ok\n".repeat(2) }),
    };
    const engine = new CompressionEngine({
      minInputLength: 1,
      maxOutputBytes: 1_000_000,
      minCompressionRatio: 0,
      recoverCriticalLines: 10,
    });
    engine.register(dropper);
    const text = `${"ok\n".repeat(20)}ERROR: foo exploded\n`;
    const out = engine.compress({ command: "make", text });
    assert.match(out.text, /ERROR: foo exploded/);
    assert.match(out.text, /\[clearance\] 1 error line\(s\) recovered/);
  });

  it("returns original when compression is not meaningful", () => {
    const noop: Processor = {
      name: "noop",
      canHandle: () => true,
      process: (i) => ({ text: i.text.slice(0, i.text.length - 1) }),
    };
    const engine = new CompressionEngine({
      minInputLength: 1,
      maxOutputBytes: 1_000_000,
      minCompressionRatio: 0.5,
      recoverCriticalLines: 0,
    });
    engine.register(noop);
    const text = "keep-me-please-" + "a".repeat(80);
    const out = engine.compress({ command: "cat", text });
    assert.equal(out.text, text);
  });

  it("keeps redacted output even when larger", () => {
    const redactor: Processor = {
      name: "env",
      canHandle: () => true,
      process: (i) => ({ text: `${i.text}\nREDACTED_NOTE`, redacted: true }),
    };
    const engine = new CompressionEngine({
      minInputLength: 1,
      maxOutputBytes: 1_000_000,
      minCompressionRatio: 0.5,
      recoverCriticalLines: 0,
    });
    engine.register(redactor);
    const text = "SECRET=hunter2\n" + "x".repeat(80);
    const out = engine.compress({ command: "printenv", text });
    assert.equal(out.redacted, true);
    assert.match(out.text, /REDACTED_NOTE/);
  });
});
