import { commandIs } from "../match";
import { isErrorish, keepLines } from "../lines";
import type { Processor } from "../processor";

export const buildProcessor: Processor = {
  name: "build",
  handlesFailure: true,
  canHandle(input) {
    return commandIs(input.command, ["make", "cmake", "ninja", "webpack", "tsc", "gradle", "mvn"]);
  },
  process(input) {
    if (isErrorish(input.text) || /error TS/.test(input.text)) {
      return { text: keepLines(input.text, (l) => isErrorish(l) || /error TS|error:/.test(l)) };
    }
    const steps = input.text.split("\n").filter((l) => l.trim()).length;
    return { text: `[${steps} build lines collapsed]\nBuild succeeded.\n` };
  },
};
