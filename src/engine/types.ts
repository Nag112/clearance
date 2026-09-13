export interface CompressInput {
  command: string;
  text: string;
  exitCode?: number;
}

export interface CompressResult {
  text: string;
  processor: string;
  bytesIn: number;
  bytesOut: number;
  redacted: boolean;
  skipped: boolean;
}

export interface EngineConfig {
  minInputLength: number;
  maxOutputBytes: number;
  minCompressionRatio: number;
  recoverCriticalLines: number;
}
