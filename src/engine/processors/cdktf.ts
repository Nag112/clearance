import { noiseProcessor } from "./noise";

export const cdktfProcessor = noiseProcessor({
  name: "cdktf",
  bins: ["cdktf"],
  keep: (l) => /error|Error|failed/i.test(l),
});
