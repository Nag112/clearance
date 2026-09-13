import { CompressionEngine } from "../src/engine/engine";
import type { Processor } from "../src/engine/processor";
import { genericProcessor } from "../src/engine/processors/generic";

export function withProcessor(processor: Processor): CompressionEngine {
  return new CompressionEngine({
    minInputLength: 1,
    maxOutputBytes: 1_000_000,
    minCompressionRatio: 0,
    recoverCriticalLines: 20,
  })
    .register(processor)
    .register(genericProcessor);
}
