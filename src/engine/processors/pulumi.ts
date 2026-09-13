import { noiseProcessor } from "./noise";

export const pulumiProcessor = noiseProcessor({
  name: "pulumi",
  bins: ["pulumi"],
  keep: (l) => /error|failed|Resources:|Duration:/i.test(l),
  success: (text) =>
    text
      .split("\n")
      .filter((l) => /Resources:|Duration:|Permalink:/.test(l))
      .join("\n") + "\n",
});
