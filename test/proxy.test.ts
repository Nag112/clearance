import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { startProxy } from "../src/proxy/server";

function tmpLogDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "clearance-proxy-"));
}

describe("proxy health", () => {
  it("serves GET /health on loopback", async () => {
    const proxy = await startProxy({ port: 0, upstream: "http://127.0.0.1:1", logDir: tmpLogDir() });
    assert.equal(new URL(proxy.url).hostname, "127.0.0.1");
    const res = await fetch(`${proxy.url}/health`);
    const json = (await res.json()) as { ok: boolean; service: string };
    assert.equal(res.status, 200);
    assert.equal(json.ok, true);
    assert.equal(json.service, "clearance");
    await proxy.close();
  });

  it("returns 502 when upstream is down", async () => {
    const dir = tmpLogDir();
    const proxy = await startProxy({ port: 0, upstream: "http://127.0.0.1:1", logDir: dir });
    const res = await fetch(`${proxy.url}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", messages: [] }),
    });
    assert.equal(res.status, 502);
    const json = (await res.json()) as { error: string };
    assert.equal(json.error, "clearance_upstream_unavailable");
    const lines = fs.readFileSync(path.join(dir, "requests.jsonl"), "utf8").trim().split("\n");
    assert.equal(lines.length, 1);
    const record = JSON.parse(lines[0]) as { model?: string; kind: string };
    assert.equal(record.kind, "chat");
    assert.equal(record.model, "gpt-4o");
    await proxy.close();
  });
});
