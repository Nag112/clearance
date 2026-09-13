import { createDefaultEngine, type CompressResult } from "../engine";

export interface RewriteStats {
  bytesIn: number;
  bytesOut: number;
}

export interface ToolTransform {
  command: string;
  processor: string;
  skipped: boolean;
  redacted: boolean;
  bytesIn: number;
  bytesOut: number;
  savedBytes: number;
  ratio: number;
  input: string;
  output: string;
}

export interface RewriteResult {
  body: unknown;
  stats: RewriteStats;
  items: ToolTransform[];
  model?: string;
}

const engine = createDefaultEngine();

function toTransform(command: string, input: string, result: CompressResult): ToolTransform {
  const savedBytes = Math.max(0, result.bytesIn - result.bytesOut);
  return {
    command,
    processor: result.processor,
    skipped: result.skipped,
    redacted: result.redacted,
    bytesIn: result.bytesIn,
    bytesOut: result.bytesOut,
    savedBytes,
    ratio: result.bytesIn === 0 ? 0 : savedBytes / result.bytesIn,
    input,
    output: result.text,
  };
}

function compressText(text: string, command = ""): { text: string; item: ToolTransform } {
  const result = engine.compress({ command, text });
  return { text: result.text, item: toTransform(command, text, result) };
}

function rewriteContent(content: unknown, command: string, items: ToolTransform[]): unknown {
  if (typeof content === "string") {
    const compressed = compressText(content, command);
    items.push(compressed.item);
    return compressed.text;
  }
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part && typeof part === "object" && "type" in part && (part as { type: string }).type === "text") {
        const text = String((part as { text?: string }).text ?? "");
        const compressed = compressText(text, command);
        items.push(compressed.item);
        return { ...part, text: compressed.text };
      }
      if (typeof part === "string") {
        const compressed = compressText(part, command);
        items.push(compressed.item);
        return compressed.text;
      }
      return part;
    });
  }
  return content;
}

function modelOf(body: unknown): string | undefined {
  if (body && typeof body === "object" && "model" in body) {
    const model = (body as { model?: unknown }).model;
    return typeof model === "string" ? model : undefined;
  }
  return undefined;
}

export function rewriteChatCompletionsBody(body: unknown): RewriteResult {
  const items: ToolTransform[] = [];
  let bytesIn = 0;
  let bytesOut = 0;
  if (!body || typeof body !== "object") {
    return { body, stats: { bytesIn, bytesOut }, items, model: modelOf(body) };
  }
  const clone = JSON.parse(JSON.stringify(body)) as { messages?: unknown[]; model?: unknown };
  const messages = clone.messages;
  if (!Array.isArray(messages)) {
    return { body: clone, stats: { bytesIn, bytesOut }, items, model: modelOf(clone) };
  }
  for (const message of messages) {
    if (!message || typeof message !== "object") {
      continue;
    }
    const role = (message as { role?: string }).role;
    if (role !== "tool" && role !== "function") {
      continue;
    }
    const name = String((message as { name?: string }).name ?? "");
    (message as { content?: unknown }).content = rewriteContent(
      (message as { content?: unknown }).content,
      name,
      items,
    );
  }
  for (const item of items) {
    bytesIn += item.bytesIn;
    bytesOut += item.bytesOut;
  }
  return { body: clone, stats: { bytesIn, bytesOut }, items, model: modelOf(clone) };
}

export function rewriteResponsesBody(body: unknown): RewriteResult {
  const items: ToolTransform[] = [];
  let bytesIn = 0;
  let bytesOut = 0;
  if (!body || typeof body !== "object") {
    return { body, stats: { bytesIn, bytesOut }, items, model: modelOf(body) };
  }
  const clone = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) {
        walk(child);
      }
      return;
    }
    const rec = node as Record<string, unknown>;
    const type = String(rec.type ?? rec.role ?? "");
    if (type === "tool_result" || type === "function_call_output" || rec.role === "tool") {
      const command = String(rec.name ?? rec.call_id ?? "");
      if (typeof rec.output === "string") {
        const compressed = compressText(rec.output, command);
        items.push(compressed.item);
        rec.output = compressed.text;
      }
      if (rec.content !== undefined) {
        rec.content = rewriteContent(rec.content, command, items);
      }
    }
    for (const value of Object.values(rec)) {
      walk(value);
    }
  };
  walk(clone);
  for (const item of items) {
    bytesIn += item.bytesIn;
    bytesOut += item.bytesOut;
  }
  return { body: clone, stats: { bytesIn, bytesOut }, items, model: modelOf(clone) };
}

export function isGenerationPath(pathname: string): "chat" | "responses" | "passthrough" {
  const path = pathname.replace(/\/+$/, "");
  if (path.endsWith("/chat/completions") || path === "/chat/completions") {
    return "chat";
  }
  if (path.endsWith("/responses") || path === "/responses") {
    return "responses";
  }
  return "passthrough";
}
