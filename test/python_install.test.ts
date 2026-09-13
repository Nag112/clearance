import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pythonInstallProcessor } from "../src/engine/processors/python_install";
import { withProcessor } from "./helpers";

describe("python_install processor", () => {
  it("keeps pip ERROR lines", () => {
    const text = "Collecting foo\nERROR: Could not find a version that satisfies the requirement foo\n";
    const out = withProcessor(pythonInstallProcessor).compress({ command: "pip install foo", text, exitCode: 1 });
    assert.match(out.text, /Could not find a version/);
  });
});
