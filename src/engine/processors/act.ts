import { noiseProcessor } from "./noise";

export const actProcessor = noiseProcessor({
  name: "act",
  bins: ["act"],
  keep: (l) => /error|Error|fail|❌/.test(l),
});
