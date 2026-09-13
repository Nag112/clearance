import http from "node:http";
import type { AddressInfo } from "node:net";
import { forwardRequest } from "./forward";
import { appendRequestLog, buildRequestRecord, defaultLogDir, loggingEnabled } from "./log";
import { isGenerationPath, rewriteChatCompletionsBody, rewriteResponsesBody, type RewriteResult } from "./rewrite";

export interface ProxyOptions {
  host?: string;
  port?: number;
  upstream?: string;
  logDir?: string;
  onSavings?: (savedBytes: number) => void;
}

export interface ClearanceProxy {
  url: string;
  port: number;
  close(): Promise<void>;
}

const DEFAULT_UPSTREAM = "https://api.githubcopilot.com";

export function startProxy(options: ProxyOptions = {}): Promise<ClearanceProxy> {
  const host = options.host ?? "127.0.0.1";
  const upstream = options.upstream ?? process.env.CLEARANCE_UPSTREAM ?? DEFAULT_UPSTREAM;
  const logDir = options.logDir ?? defaultLogDir();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${host}`);
    if (req.method === "GET" && (url.pathname === "/health" || url.pathname.endsWith("/health"))) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, upstream, service: "clearance", logDir }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      void (async () => {
        let body = Buffer.concat(chunks);
        const kind = req.method === "POST" ? isGenerationPath(url.pathname) : "passthrough";
        const incomingBytes = body.length;
        let incomingBody: unknown = incomingBytes ? body.toString("utf8") : "";
        let outgoingBody: unknown = incomingBody;
        let rewrite: RewriteResult | undefined;
        let parseError: string | undefined;
        if (kind !== "passthrough" && body.length > 0) {
          try {
            const parsed: unknown = JSON.parse(body.toString("utf8"));
            incomingBody = parsed;
            rewrite = kind === "chat" ? rewriteChatCompletionsBody(parsed) : rewriteResponsesBody(parsed);
            body = Buffer.from(JSON.stringify(rewrite.body), "utf8");
            outgoingBody = rewrite.body;
            const saved = rewrite.stats.bytesIn - rewrite.stats.bytesOut;
            if (saved > 0) {
              options.onSavings?.(saved);
            }
          } catch (err) {
            parseError = err instanceof Error ? err.message : String(err);
          }
        }
        if (loggingEnabled()) {
          try {
            appendRequestLog(
              logDir,
              buildRequestRecord({
                method: req.method ?? "GET",
                path: url.pathname,
                kind,
                incomingBytes,
                incomingBody,
                outgoingBytes: body.length,
                outgoingBody,
                rewrite,
                parseError,
              }),
            );
          } catch {
            // logging must never block the proxy
          }
        }
        await forwardRequest(req, res, body, { upstream });
      })();
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(options.port ?? 0, host, () => {
      const address = server.address() as AddressInfo;
      resolve({
        url: `http://${host}:${address.port}`,
        port: address.port,
        close: () =>
          new Promise((resClose, rej) => {
            server.close((err) => (err ? rej(err) : resClose()));
          }),
      });
    });
    server.on("error", reject);
  });
}
