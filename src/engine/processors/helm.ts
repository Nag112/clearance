import { noiseProcessor } from "./noise";

export const helmProcessor = noiseProcessor({
  name: "helm",
  bins: ["helm"],
  keep: (l) => /error|Error|FAILED/.test(l),
});
