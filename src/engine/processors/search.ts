import { commandIs } from "../match";
import type { Processor } from "../processor";

export const searchProcessor: Processor = {
  name: "search",
  canHandle(input) {
    return commandIs(input.command, ["rg", "grep", "ag", "ack"]);
  },
  process(input) {
    const lines = input.text.split("\n");
    const max = 30;
    if (lines.length <= max) {
      return { text: input.text };
    }
    return { text: `${lines.slice(0, max).join("\n")}\n[clearance] ${lines.length - max} search hit(s) omitted\n` };
  },
};
