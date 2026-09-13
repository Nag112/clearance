import { CompressionEngine } from "./engine";
import { envProcessor } from "./processors/env";
import { genericProcessor } from "./processors/generic";
import { gitProcessor } from "./processors/git";
import { testProcessor } from "./processors/test";

export function createDefaultEngine(): CompressionEngine {
  return new CompressionEngine()
    .register(gitProcessor)
    .register(testProcessor)
    .register(envProcessor)
    .register(genericProcessor);
}

export { CompressionEngine } from "./engine";
export { genericProcessor } from "./processors/generic";
export type { CompressInput, CompressResult, EngineConfig } from "./types";
