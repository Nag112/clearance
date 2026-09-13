import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProcessor } from "../src/engine/processors/build";
import { withProcessor } from "./helpers";

describe("build processor", () => {
  it("keeps make errors", () => {
    const text = "cc -c foo.c\nfoo.c:1:1: error: expected ';'\nmake: *** [all] Error 1\n";
    const out = withProcessor(buildProcessor).compress({ command: "make", text, exitCode: 2 });
    assert.match(out.text, /expected ';'/);
  });
});
