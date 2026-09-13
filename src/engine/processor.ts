import type { CompressInput } from "./types";

export interface ProcessorResult {
  text: string;
  redacted?: boolean;
}

export interface Processor {
  name: string;
  handlesFailure?: boolean;
  canHandle(input: CompressInput): boolean;
  process(input: CompressInput): ProcessorResult;
}
