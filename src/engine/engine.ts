import { DEFAULT_CONFIG } from "./config";
import type { Processor } from "./processor";
import { ProcessorRegistry } from "./registry";
import { recoverCriticalLines } from "./recovery";

export class CompressionEngine {
  readonly registry = new ProcessorRegistry();

  constructor(private readonly config: EngineConfig = DEFAULT_CONFIG) {}

  register(processor: Processor): this {
    this.registry.register(processor);
    return this;
  }

  compress(input: CompressInput): CompressResult {
    const original = input.text;
    const bytesIn = byteLength(original);

    if (original.length < this.config.minInputLength) {
      return result(original, "passthrough", bytesIn, false, true);
    }

    let working = original;
    if (bytesIn > this.config.maxOutputBytes) {
      const sliced = original.slice(0, this.config.maxOutputBytes);
      working = `${sliced}\n[clearance] truncated: ${bytesIn} bytes exceeded maxOutputBytes ${this.config.maxOutputBytes}\n`;
    }

    const failed = (input.exitCode ?? 0) !== 0;
    let processor = this.registry.match({ ...input, text: working });
    if (processor && failed && !processor.handlesFailure) {
      processor = this.registry.findByName("generic") ?? processor;
    }
    if (!processor) {
      return result(working, "passthrough", bytesIn, false, false);
    }
    const processed = processor.process({ ...input, text: working });
    const recovered = recoverCriticalLines(working, processed.text, this.config.recoverCriticalLines);
    return result(recovered, processor.name, bytesIn, Boolean(processed.redacted), false);
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
