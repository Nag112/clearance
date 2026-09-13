import { keepLines } from "../lines";
import { noiseProcessor } from "./noise";

export const kubectlProcessor = noiseProcessor({
  name: "kubectl",
  bins: ["kubectl"],
  keep: (l) => /Error|Warning|Failed|No resources/.test(l) || !/^\s/.test(l),
  success: (text) => keepLines(text, (l, i) => i < 25 || /Error|Warning/.test(l), "kubectl rows omitted"),
});
