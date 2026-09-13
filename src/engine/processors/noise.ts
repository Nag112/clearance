import { commandIs } from "../match";
import { isErrorish, keepLines } from "../lines";
import type { Processor } from "../processor";

export function noiseProcessor(opts: {
  name: string;
  bins: string[];
  extra?: (command: string) => boolean;
  keep?: (line: string) => boolean;
  success?: (text: string) => string;
}): Processor {
  return {
    name: opts.name,
    handlesFailure: true,
    canHandle(input) {
      return commandIs(input.command, opts.bins) || Boolean(opts.extra?.(input.command));
    },
    process(input) {
      const keep = opts.keep ?? ((l) => isErrorish(l));
      if (input.text.split("\n").some((l) => keep(l) && isErrorish(l))) {
        return { text: keepLines(input.text, keep) };
      }
      if (opts.success) {
        return { text: opts.success(input.text) };
      }
      const n = input.text.split("\n").length;
      return { text: `[clearance] ${opts.name}: ${n} lines collapsed\n` };
    },
  };
}
