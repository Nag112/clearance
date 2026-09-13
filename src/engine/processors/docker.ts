import { commandIs } from "../match";
import { isErrorish, keepLines } from "../lines";
import type { Processor } from "../processor";

export const dockerProcessor: Processor = {
  name: "docker",
  handlesFailure: true,
  canHandle(input) {
    return commandIs(input.command, ["docker", "podman", "docker-compose", "compose"]);
  },
  process(input) {
    if (isErrorish(input.text) || /ERROR|failed to/.test(input.text)) {
      return { text: keepLines(input.text, (l) => isErrorish(l) || /ERROR|failed|Step /.test(l)) };
    }
    const steps = input.text.split("\n").filter((l) => /^Step \d+/.test(l)).length;
    const tags = input.text.split("\n").filter((l) => /Successfully tagged|naming to/.test(l));
    return { text: `[${steps} build steps]\n${tags.slice(-3).join("\n")}\n` };
  },
};
