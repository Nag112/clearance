import type { Processor } from "../processor";

const SOURCE = /\.(ts|tsx|js|jsx|py|go|rs|java|kt|c|cc|cpp|h|hpp|rb|php|swift|cs|scala|ex|exs|md)$/;

export const fileContentProcessor: Processor = {
  name: "file_content",
  canHandle(input) {
    return /(?:^|[\s'"])(?:cat|head|tail|bat|type)\s+/.test(input.command) && SOURCE.test(input.command);
  },
  process(input) {
    return { text: input.text };
  },
};
