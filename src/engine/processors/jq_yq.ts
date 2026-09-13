import { commandIs } from "../match";
import type { Processor } from "../processor";

export const jqYqProcessor: Processor = {
  name: "jq_yq",
  canHandle(input) {
    return commandIs(input.command, ["jq", "yq"]);
  },
  process(input) {
    const lines = input.text.split("\n");
    if (lines.length <= 80) {
      return { text: input.text };
    }
    return { text: `${lines.slice(0, 80).join("\n")}\n[clearance] ${lines.length - 80} jq/yq line(s) omitted\n` };
  },
};
