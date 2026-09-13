import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CompressionEngine } from "../src/engine/engine";
import { envProcessor } from "../src/engine/processors/env";
import { genericProcessor } from "../src/engine/processors/generic";

function engine() {
  return new CompressionEngine({
    minInputLength: 1,
    maxOutputBytes: 1_000_000,
    minCompressionRatio: 0,
    recoverCriticalLines: 10,
  })
    .register(envProcessor)
    .register(genericProcessor);
}

describe("env processor", () => {
  it("redacts secret-looking printenv values", () => {
    const text = ["PATH=/usr/bin", "GITHUB_TOKEN=gho_secret", "AUTHOR=jane", "API_KEY=abc"].join("\n");
    const out = engine().compress({ command: "printenv", text });
    assert.match(out.text, /GITHUB_TOKEN=\*\*\*/);
    assert.match(out.text, /API_KEY=\*\*\*/);
    assert.match(out.text, /PATH=\/usr\/bin/);
    assert.match(out.text, /AUTHOR=jane/);
    assert.equal(out.redacted, true);
  });

  it("leaves cat .env unchanged", () => {
    const text = "SECRET=keep-editing-me\n" + "x".repeat(20);
    const out = engine().compress({ command: "cat .env", text });
    assert.match(out.text, /SECRET=keep-editing-me/);
  });

  it("redacts cat .env.local", () => {
    const text = "SECRET=prod\n" + "x".repeat(20);
    const out = engine().compress({ command: "cat .env.local", text });
    assert.match(out.text, /SECRET=\*\*\*/);
    assert.equal(out.redacted, true);
  });
});
