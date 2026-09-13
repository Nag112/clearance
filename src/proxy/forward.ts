import http from "node:http";
import { request as httpsRequest } from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface ForwardOptions {
  upstream: string;
  timeoutMs?: number;
}

export async function forwardRequest(
  req: IncomingMessage,
  res: ServerResponse,
  body: Buffer,
  options: ForwardOptions,
): Promise<void> {
  const upstream = new URL(options.upstream);
  const incomingUrl = new URL(req.url ?? "/", "http://127.0.0.1");
  const targetPath = incomingUrl.pathname + incomingUrl.search;
  const headers = { ...req.headers, host: upstream.host };
  delete headers["content-length"];
  headers["content-length"] = String(body.length);

  const transport = upstream.protocol === "http:" ? http.request : httpsRequest;
  await new Promise<void>((resolve, reject) => {
    const proxyReq = transport(
      {
        protocol: upstream.protocol,
        hostname: upstream.hostname,
        port: upstream.port || undefined,
        path: targetPath,
        method: req.method,
        headers,
        timeout: options.timeoutMs ?? 120_000,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
        proxyRes.on("end", () => resolve());
        proxyRes.on("error", reject);
      },
    );
    proxyReq.on("error", (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "clearance_upstream_unavailable", message: err.message }));
      }
      resolve();
    });
    proxyReq.on("timeout", () => {
      proxyReq.destroy(new Error("upstream timeout"));
    });
    proxyReq.end(body);
  });
}
