import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cargoProcessor } from "../src/engine/processors/cargo";
import { withProcessor } from "./helpers";

describe("cargo processor", () => {
  it("counts compiled crates and keeps Finished", () => {
    const compiling = Array.from({ length: 40 }, (_, i) => `   Compiling crate${i} v1.0.0`);
    const text = [...compiling, "    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.2s"].join("\n");
    const out = withProcessor(cargoProcessor).compress({ command: "cargo build", text });
    assert.match(out.text, /40 crates compiled/);
    assert.match(out.text, /Finished/);
  });

  it("keeps rustc errors", () => {
    const text = "error[E0308]: mismatched types\n --> src/main.rs:1:1\n";
    const out = withProcessor(cargoProcessor).compress({ command: "cargo build", text, exitCode: 1 });
    assert.match(out.text, /E0308/);
  });
});
