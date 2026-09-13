import { noiseProcessor } from "./noise";

export const nixProcessor = noiseProcessor({
  name: "nix",
  bins: ["nix", "nix-build", "nix-shell"],
  keep: (l) => /error|failed/i.test(l),
});
