import { noiseProcessor } from "./noise";

export const ghProcessor = noiseProcessor({
  name: "gh",
  bins: ["gh"],
  keep: (l) => /error|HTTP |GraphQL/.test(l),
  success: (text) => {
    const lines = text.split("\n");
    if (lines.length <= 25) {
      return text;
    }
    return `${lines.slice(0, 25).join("\n")}\n[clearance] ${lines.length - 25} gh line(s) omitted\n`;
  },
});
