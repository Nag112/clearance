import { DEFAULT_CONFIG } from "./config";
import type { CompressInput, CompressResult, EngineConfig } from "./types";

export class CompressionEngine {
  constructor(private readonly config: EngineConfig = DEFAULT_CONFIG) {}

  compress(input: CompressInput): CompressResult {
    const original = input.text;
    const bytesIn = byteLength(original);

    if (original.length < this.config.minInputLength) {
      return result(original, "passthrough", bytesIn, false, true);
    }

    let text = original;
    if (bytesIn > this.config.maxOutputBytes) {
      const sliced = original.slice(0, this.config.maxOutputBytes);
      text = `${sliced}\n[clearance] truncated: ${bytesIn} bytes exceeded maxOutputBytes ${this.config.maxOutputBytes}\n`;
      return result(text, "size-cap", bytesIn, false, false);
    }

    return result(text, "passthrough", bytesIn, false, false);
  }
}

export function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function result(
  text: string,
  processor: string,
  bytesIn: number,
  redacted: boolean,
  skipped: boolean,
): CompressResult {
  return {
    text,
    processor,
    bytesIn,
    bytesOut: byteLength(text),
    redacted,
    skipped,
  };
}
