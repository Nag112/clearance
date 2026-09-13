import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dockerProcessor } from "../src/engine/processors/docker";
import { withProcessor } from "./helpers";

describe("docker processor", () => {
  it("keeps docker ERROR lines", () => {
    const text = "Step 1/20 : FROM node\n ---> abc\nERROR: failed to solve: process /bin/sh failed\n";
    const out = withProcessor(dockerProcessor).compress({ command: "docker build .", text, exitCode: 1 });
    assert.match(out.text, /failed to solve/);
  });
});
