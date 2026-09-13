import { clean } from "../cleanup";
import type { Processor } from "../processor";

export const genericProcessor: Processor = {
  name: "generic",
  handlesFailure: true,
  canHandle() {
    return true;
  },
  process(input) {
    return { text: clean(input.text) };
  },
};
