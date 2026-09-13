import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { startProxy } from "../src/proxy/server";

describe("proxy health", () => {
  it("serves GET /health on loopback", async () => {
    const proxy = await startProxy({ port: 0, upstream: "http://127.0.0.1:1" });
    assert.equal(new URL(proxy.url).hostname, "127.0.0.1");
    const res = await fetch(`${proxy.url}/health`);
    const json = (await res.json()) as { ok: boolean; service: string };
    assert.equal(res.status, 200);
    assert.equal(json.ok, true);
    assert.equal(json.service, "clearance");
    await proxy.close();
  });

  it("returns 502 when upstream is down", async () => {
    const proxy = await startProxy({ port: 0, upstream: "http://127.0.0.1:1" });
    const res = await fetch(`${proxy.url}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", messages: [] }),
    });
    assert.equal(res.status, 502);
    const json = (await res.json()) as { error: string };
    assert.equal(json.error, "clearance_upstream_unavailable");
    await proxy.close();
  });
});
