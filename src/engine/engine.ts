import type { CompressInput, CompressResult } from "./types";

export class CompressionEngine {
  compress(input: CompressInput): CompressResult {
    const text = input.text;
    return {
      text,
      processor: "passthrough",
      bytesIn: byteLength(text),
      bytesOut: byteLength(text),
      redacted: false,
      skipped: false,
    };
  }
}

export function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}
