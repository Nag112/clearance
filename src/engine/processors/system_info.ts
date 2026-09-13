import { noiseProcessor } from "./noise";

export const systemInfoProcessor = noiseProcessor({
  name: "system_info",
  bins: ["ps", "df", "top", "htop", "vmstat", "iostat"],
  keep: (l) => /error|full|100%/i.test(l),
  success: (text) => {
    const lines = text.split("\n");
    return `${lines.slice(0, 15).join("\n")}\n[clearance] ${Math.max(0, lines.length - 15)} system_info line(s) omitted\n`;
  },
});
