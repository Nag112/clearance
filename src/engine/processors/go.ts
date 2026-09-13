import { noiseProcessor } from "./noise";

export const goProcessor = noiseProcessor({
  name: "go",
  bins: ["go"],
  keep: (l) => /error|# |FAIL|ok |--- FAIL/.test(l),
  success: (text) => {
    const pkgs = text.split("\n").filter((l) => /^# /.test(l)).length;
    return `[${pkgs} go compile lines]\n`;
  },
});
