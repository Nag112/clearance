import { commandIs } from "../match";
import { isErrorish, keepLines } from "../lines";
import type { Processor } from "../processor";

export const mavenGradleProcessor: Processor = {
  name: "maven_gradle",
  handlesFailure: true,
  canHandle(input) {
    return commandIs(input.command, ["mvn", "gradle", "gradlew", "./gradlew"]);
  },
  process(input) {
    if (isErrorish(input.text) || /BUILD FAILED/.test(input.text)) {
      return { text: keepLines(input.text, (l) => isErrorish(l) || /FAILURE|FAILED|error:/.test(l)) };
    }
    const done = input.text.split("\n").filter((l) => /BUILD SUCCESS/.test(l));
    return { text: (done.slice(-1)[0] ?? "Build succeeded.") + "\n" };
  },
};
