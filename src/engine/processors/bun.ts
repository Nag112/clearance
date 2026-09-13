import { noiseProcessor } from "./noise";

export const bunProcessor = noiseProcessor({
  name: "bun",
  bins: ["bun"],
  keep: (l) => /error|ERR|Failed/.test(l),
  success: () => "bun install succeeded.\n",
});
