import { CompressionEngine } from "./engine";
import { envProcessor } from "./processors/env";
import { genericProcessor } from "./processors/generic";
import { gitProcessor } from "./processors/git";

export function createDefaultEngine(): CompressionEngine {
  return new CompressionEngine().register(gitProcessor).register(envProcessor).register(genericProcessor);
}

export function createDefaultEngine(): CompressionEngine {
  return new CompressionEngine().register(envProcessor).register(genericProcessor);
}

export { CompressionEngine } from "./engine";
export { genericProcessor } from "./processors/generic";
export type { CompressInput, CompressResult, EngineConfig } from "./types";
