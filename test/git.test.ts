import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CompressionEngine } from "../src/engine/engine";
import { gitProcessor } from "../src/engine/processors/git";
import { genericProcessor } from "../src/engine/processors/generic";

function engine() {
  return new CompressionEngine({
    minInputLength: 1,
    maxOutputBytes: 1_000_000,
    minCompressionRatio: 0,
    recoverCriticalLines: 10,
  })
    .register(gitProcessor)
    .register(genericProcessor);
}

describe("git processor", () => {
  it("keeps plus/minus and hunk headers while trimming context", () => {
    const ctx = Array.from({ length: 12 }, (_, i) => ` unchanged ${i}`);
    const text = [
      "diff --git a/src/a.ts b/src/a.ts",
      "index abc..def 100644",
      "--- a/src/a.ts",
      "+++ b/src/a.ts",
      "@@ -1,20 +1,21 @@",
      ...ctx.map((c) => ` ${c}`),
      "-old",
      "+new",
      ...ctx.map((c) => ` ${c}`),
    ].join("\n");
    const out = engine().compress({ command: "git diff", text });
    assert.match(out.text, /^-old$/m);
    assert.match(out.text, /^\+new$/m);
    assert.match(out.text, /^@@ /m);
    assert.doesNotMatch(out.text, /^index /m);
    assert.match(out.text, /unchanged context line\(s\) omitted/);
  });
});
