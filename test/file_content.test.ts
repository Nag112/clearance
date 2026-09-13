import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileContentProcessor } from "../src/engine/processors/file_content";
import { withProcessor } from "./helpers";

describe("file_content processor", () => {
  it("passes source files through unchanged", () => {
    const text = "export function hello() {\n  return 1;\n}\n";
    const out = withProcessor(fileContentProcessor).compress({ command: "cat src/hello.ts", text });
    assert.equal(out.text, text);
    assert.equal(out.processor, "file_content");
  });
});
