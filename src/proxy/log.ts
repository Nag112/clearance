import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { RewriteResult } from "./rewrite";

export interface RequestLogRecord {
  id: string;
  ts: string;
  method: string;
  path: string;
  kind: "chat" | "responses" | "passthrough";
  model?: string;
  parseError?: string;
  incomingBytes: number;
  outgoingBytes: number;
  incomingBody: unknown;
  outgoingBody: unknown;
  tools: RewriteResult["items"];
  efficiency: {
    toolCount: number;
    compressedCount: number;
    skippedCount: number;
    redactedCount: number;
    toolBytesIn: number;
    toolBytesOut: number;
    savedBytes: number;
    ratio: number;
    requestBodySavedBytes: number;
    requestBodyRatio: number;
    processors: Record<string, { count: number; bytesIn: number; bytesOut: number; savedBytes: number }>;
  };
}

export interface LogSummary {
  updatedAt: string;
  requests: number;
  generationRequests: number;
  passthroughRequests: number;
  parseErrors: number;
  toolBytesIn: number;
  toolBytesOut: number;
  savedBytes: number;
  ratio: number;
  processors: Record<string, { count: number; bytesIn: number; bytesOut: number; savedBytes: number }>;
}

export function defaultLogDir(): string {
  return process.env.CLEARANCE_LOG_DIR || path.resolve(process.cwd(), ".clearance");
}

export function loggingEnabled(): boolean {
  return process.env.CLEARANCE_LOG !== "0";
}

function emptySummary(): LogSummary {
  return {
    updatedAt: new Date().toISOString(),
    requests: 0,
    generationRequests: 0,
    passthroughRequests: 0,
    parseErrors: 0,
    toolBytesIn: 0,
    toolBytesOut: 0,
    savedBytes: 0,
    ratio: 0,
    processors: {},
  };
}

function addProcessor(
  bag: LogSummary["processors"],
  name: string,
  bytesIn: number,
  bytesOut: number,
): void {
  const rec = bag[name] ?? { count: 0, bytesIn: 0, bytesOut: 0, savedBytes: 0 };
  rec.count += 1;
  rec.bytesIn += bytesIn;
  rec.bytesOut += bytesOut;
  rec.savedBytes += Math.max(0, bytesIn - bytesOut);
  bag[name] = rec;
}

export function buildRequestRecord(opts: {
  method: string;
  path: string;
  kind: "chat" | "responses" | "passthrough";
  incomingBytes: number;
  incomingBody: unknown;
  outgoingBytes: number;
  outgoingBody: unknown;
  rewrite?: RewriteResult;
  parseError?: string;
}): RequestLogRecord {
  const tools = opts.rewrite?.items ?? [];
  const processors: LogSummary["processors"] = {};
  let toolBytesIn = 0;
  let toolBytesOut = 0;
  let compressedCount = 0;
  let skippedCount = 0;
  let redactedCount = 0;
  for (const tool of tools) {
    toolBytesIn += tool.bytesIn;
    toolBytesOut += tool.bytesOut;
    if (tool.skipped) {
      skippedCount += 1;
    } else if (tool.bytesOut < tool.bytesIn) {
      compressedCount += 1;
    }
    if (tool.redacted) {
      redactedCount += 1;
    }
    addProcessor(processors, tool.processor, tool.bytesIn, tool.bytesOut);
  }
  const savedBytes = Math.max(0, toolBytesIn - toolBytesOut);
  const requestBodySavedBytes = Math.max(0, opts.incomingBytes - opts.outgoingBytes);
  return {
    id: randomUUID(),
    ts: new Date().toISOString(),
    method: opts.method,
    path: opts.path,
    kind: opts.kind,
    model: opts.rewrite?.model,
    parseError: opts.parseError,
    incomingBytes: opts.incomingBytes,
    outgoingBytes: opts.outgoingBytes,
    incomingBody: opts.incomingBody,
    outgoingBody: opts.outgoingBody,
    tools,
    efficiency: {
      toolCount: tools.length,
      compressedCount,
      skippedCount,
      redactedCount,
      toolBytesIn,
      toolBytesOut,
      savedBytes,
      ratio: toolBytesIn === 0 ? 0 : savedBytes / toolBytesIn,
      requestBodySavedBytes,
      requestBodyRatio: opts.incomingBytes === 0 ? 0 : requestBodySavedBytes / opts.incomingBytes,
      processors,
    },
  };
}

export function appendRequestLog(dir: string, record: RequestLogRecord): void {
  fs.mkdirSync(dir, { recursive: true });
  const jsonlPath = path.join(dir, "requests.jsonl");
  fs.appendFileSync(jsonlPath, `${JSON.stringify(record)}\n`, "utf8");

  const summaryPath = path.join(dir, "summary.json");
  let summary = emptySummary();
  if (fs.existsSync(summaryPath)) {
    try {
      summary = { ...emptySummary(), ...(JSON.parse(fs.readFileSync(summaryPath, "utf8")) as LogSummary) };
      summary.processors = summary.processors ?? {};
    } catch {
      summary = emptySummary();
    }
  }
  summary.updatedAt = record.ts;
  summary.requests += 1;
  if (record.kind === "passthrough") {
    summary.passthroughRequests += 1;
  } else {
    summary.generationRequests += 1;
  }
  if (record.parseError) {
    summary.parseErrors += 1;
  }
  summary.toolBytesIn += record.efficiency.toolBytesIn;
  summary.toolBytesOut += record.efficiency.toolBytesOut;
  summary.savedBytes += record.efficiency.savedBytes;
  summary.ratio = summary.toolBytesIn === 0 ? 0 : summary.savedBytes / summary.toolBytesIn;
  for (const [name, rec] of Object.entries(record.efficiency.processors)) {
    const cur = summary.processors[name] ?? { count: 0, bytesIn: 0, bytesOut: 0, savedBytes: 0 };
    cur.count += rec.count;
    cur.bytesIn += rec.bytesIn;
    cur.bytesOut += rec.bytesOut;
    cur.savedBytes += rec.savedBytes;
    summary.processors[name] = cur;
  }
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}
