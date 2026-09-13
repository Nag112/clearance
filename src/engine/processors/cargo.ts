import { commandIs } from "../match";
import { isErrorish, keepLines } from "../lines";
import type { Processor } from "../processor";

export const cargoProcessor: Processor = {
  name: "cargo",
  handlesFailure: true,
  canHandle(input) {
    return commandIs(input.command, ["cargo"]);
  },
  process(input) {
    if (isErrorish(input.text) || /error\[E/.test(input.text)) {
      return { text: keepLines(input.text, (l) => isErrorish(l) || /error\[E|warning:|--> /.test(l)) };
    }
    const compiling = input.text.split("\n").filter((l) => /Compiling /.test(l)).length;
    const finished = input.text.split("\n").filter((l) => /Finished /.test(l));
    return { text: `[${compiling} crates compiled]\n${finished.slice(-1).join("\n")}\n` };
  },
};
