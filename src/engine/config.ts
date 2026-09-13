import type { EngineConfig } from "./types";

export const DEFAULT_CONFIG: EngineConfig = {
  minInputLength: 80,
  maxOutputBytes: 10 * 1024 * 1024,
  minCompressionRatio: 0.05,
  recoverCriticalLines: 40,
};
