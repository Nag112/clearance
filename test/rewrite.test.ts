import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rewriteChatCompletionsBody, rewriteResponsesBody } from "../src/proxy/rewrite";

describe("request rewrite", () => {
  it("compresses chat tool message content", () => {
    const npm = Array.from({ length: 40 }, (_, i) => `added package-${i}`).join("\n");
    const { body, stats } = rewriteChatCompletionsBody({
      model: "gpt-4o",
      messages: [
        { role: "user", content: "install" },
        { role: "tool", name: "npm install", content: npm },
      ],
    });
    const messages = (body as { messages: { content: string }[] }).messages;
    assert.equal((body as { model: string }).model, "gpt-4o");
    assert.match(messages[1].content, /Build succeeded/);
    assert.ok(stats.bytesOut < stats.bytesIn);
  });

  it("compresses responses tool_result output", () => {
    const npm = Array.from({ length: 40 }, (_, i) => `added package-${i}`).join("\n");
    const { body } = rewriteResponsesBody({
      model: "gpt-5.5",
      input: [{ type: "tool_result", name: "npm install", output: npm }],
    });
    const output = (body as { input: { output: string }[] }).input[0].output;
    assert.match(output, /Build succeeded/);
  });
});
