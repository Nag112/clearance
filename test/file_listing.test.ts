import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileListingProcessor } from "../src/engine/processors/file_listing";
import { withProcessor } from "./helpers";

describe("file_listing processor", () => {
  it("marks truncated tree output", () => {
    const text = Array.from({ length: 80 }, (_, i) => `file_${i}.ts`).join("\n") + "\n20 directories, 80 files\n";
    const out = withProcessor(fileListingProcessor).compress({ command: "tree", text });
    assert.match(out.text, /lines truncated/);
    assert.match(out.text, /20 directories, 80 files/);
  });
});
