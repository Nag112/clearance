import { noiseProcessor } from "./noise";

export const justProcessor = noiseProcessor({
  name: "just",
  bins: ["just"],
  keep: (l) => /error|Error/.test(l),
});
