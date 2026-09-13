import { commandIs } from "../match";
import { isErrorish, keepLines } from "../lines";
import type { Processor } from "../processor";

export const packageListProcessor: Processor = {
  name: "package_list",
  handlesFailure: true,
  canHandle(input) {
    return (
      commandIs(input.command, ["npm", "yarn", "pnpm"]) &&
      /\b(install|ci|add|remove)\b/.test(input.command)
    );
  },
  process(input) {
    if (isErrorish(input.text) || /ERR!|error/.test(input.text)) {
      return { text: keepLines(input.text, (l) => isErrorish(l) || /ERR!|npm ERR/.test(l)) };
    }
    return { text: "Build succeeded.\n" };
  },
};
