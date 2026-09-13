import { noiseProcessor } from "./noise";

export const miseProcessor = noiseProcessor({
  name: "mise",
  bins: ["mise", "rtx"],
  keep: (l) => /error|failed/i.test(l),
});
