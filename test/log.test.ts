import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { appendRequestLog, buildRequestRecord } from "../src/proxy/log";
import { rewriteChatCompletionsBody } from "../src/proxy/rewrite";

describe("request logging", () => {
  it("records full tool input/output and efficiency totals", () => {
    const npm = Array.from({ length: 40 }, (_, i) => `added package-${i}`).join("\n");
    const incoming = {
      model: "gpt-4o",
      messages: [
        { role: "user", content: "install deps" },
        { role: "tool", name: "npm install", content: npm },
      ],
    };
    const rewrite = rewriteChatCompletionsBody(incoming);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clearance-log-"));
    const incomingBytes = Buffer.byteLength(JSON.stringify(incoming));
    const outgoingBytes = Buffer.byteLength(JSON.stringify(rewrite.body));
    const record = buildRequestRecord({
      method: "POST",
      path: "/chat/completions",
      kind: "chat",
      incomingBytes,
      incomingBody: incoming,
      outgoingBytes,
      outgoingBody: rewrite.body,
      rewrite,
    });
    appendRequestLog(dir, record);
    appendRequestLog(dir, record);

    assert.equal(record.model, "gpt-4o");
    assert.equal(record.tools.length, 1);
    assert.equal(record.tools[0].input, npm);
    assert.match(record.tools[0].output, /Build succeeded/);
    assert.ok(record.tools[0].bytesOut < record.tools[0].bytesIn);
    assert.ok(record.efficiency.ratio > 0);
    assert.ok(record.efficiency.processors.package_list || record.efficiency.processors.generic);

    const lines = fs.readFileSync(path.join(dir, "requests.jsonl"), "utf8").trim().split("\n");
    assert.equal(lines.length, 2);
    const parsed = JSON.parse(lines[0]) as typeof record;
    assert.equal(parsed.incomingBody.messages[1].content, npm);
    assert.match(String((parsed.outgoingBody as { messages: { content: string }[] }).messages[1].content), /Build succeeded/);

    const summary = JSON.parse(fs.readFileSync(path.join(dir, "summary.json"), "utf8")) as {
      requests: number;
      savedBytes: number;
      ratio: number;
    };
    assert.equal(summary.requests, 2);
    assert.ok(summary.savedBytes > 0);
    assert.ok(summary.ratio > 0);
  });
});
