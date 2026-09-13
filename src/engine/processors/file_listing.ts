import { commandIs } from "../match";
import type { Processor } from "../processor";

export const fileListingProcessor: Processor = {
  name: "file_listing",
  canHandle(input) {
    return commandIs(input.command, ["ls", "tree", "find", "fd"]);
  },
  process(input) {
    const lines = input.text.split("\n");
    const max = 40;
    if (lines.length <= max) {
      return { text: input.text };
    }
    const head = lines.slice(0, max);
    const totals = lines.filter((l) => /director(y|ies)|files/.test(l)).slice(-1);
    return {
      text: `${head.join("\n")}\n... (${lines.length - max} lines truncated)\n${totals.join("\n")}\n`,
    };
  },
};
