import { CompressionEngine } from "./engine";
import { genericProcessor } from "./processors/generic";

export function createDefaultEngine(): CompressionEngine {
  return new CompressionEngine().register(genericProcessor);
}

export { CompressionEngine } from "./engine";
export { genericProcessor } from "./processors/generic";
export type { CompressInput, CompressResult, EngineConfig } from "./types";
