import { noiseProcessor } from "./noise";

export const networkProcessor = noiseProcessor({
  name: "network",
  bins: ["curl", "wget", "http"],
  keep: (l) => /error|HTTP\/|curl:|failed/i.test(l),
  success: (text) => {
    const last = text.trim().split("\n").slice(-1)[0] ?? "";
    return last.includes("100%") || /saved|downloaded/i.test(text) ? "Download complete.\n" : text;
  },
});
