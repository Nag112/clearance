import { createDefaultEngine, type CompressResult } from "../engine";

export interface RewriteStats {
  bytesIn: number;
  bytesOut: number;
}

const engine = createDefaultEngine();

function compressText(text: string, command = ""): { text: string; result: CompressResult } {
  const result = engine.compress({ command, text });
  return { text: result.text, result };
}

function rewriteContent(content: unknown, command: string): unknown {
  if (typeof content === "string") {
    return compressText(content, command).text;
  }
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part && typeof part === "object" && "type" in part && (part as { type: string }).type === "text") {
        const text = String((part as { text?: string }).text ?? "");
        return { ...part, text: compressText(text, command).text };
      }
      if (typeof part === "string") {
        return compressText(part, command).text;
      }
      return part;
    });
  }
  return content;
}

export function rewriteChatCompletionsBody(body: unknown): { body: unknown; stats: RewriteStats } {
  let bytesIn = 0;
  let bytesOut = 0;
  if (!body || typeof body !== "object") {
    return { body, stats: { bytesIn, bytesOut } };
  }
  const clone = JSON.parse(JSON.stringify(body)) as { messages?: unknown[]; model?: unknown };
  const messages = clone.messages;
  if (!Array.isArray(messages)) {
    return { body: clone, stats: { bytesIn, bytesOut } };
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
    const before = JSON.stringify((message as { content?: unknown }).content ?? "");
    bytesIn += Buffer.byteLength(before);
    (message as { content?: unknown }).content = rewriteContent((message as { content?: unknown }).content, name);
    const after = JSON.stringify((message as { content?: unknown }).content ?? "");
    bytesOut += Buffer.byteLength(after);
  }
  return { body: clone, stats: { bytesIn, bytesOut } };
}

export function rewriteResponsesBody(body: unknown): { body: unknown; stats: RewriteStats } {
  let bytesIn = 0;
  let bytesOut = 0;
  if (!body || typeof body !== "object") {
    return { body, stats: { bytesIn, bytesOut } };
  }
  const clone = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }
    const rec = node as Record<string, unknown>;
    const type = String(rec.type ?? rec.role ?? "");
    if (type === "tool_result" || type === "function_call_output" || rec.role === "tool") {
      const command = String(rec.name ?? rec.call_id ?? "");
      if (typeof rec.output === "string") {
        bytesIn += Buffer.byteLength(rec.output);
        rec.output = compressText(rec.output, command).text;
        bytesOut += Buffer.byteLength(String(rec.output));
      }
      if (rec.content !== undefined) {
        const before = JSON.stringify(rec.content);
        bytesIn += Buffer.byteLength(before);
        rec.content = rewriteContent(rec.content, command);
        bytesOut += Buffer.byteLength(JSON.stringify(rec.content));
      }
    }
    for (const value of Object.values(rec)) {
      walk(value);
    }
  };
  walk(clone);
  return { body: clone, stats: { bytesIn, bytesOut } };
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
