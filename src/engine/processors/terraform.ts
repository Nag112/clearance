import { noiseProcessor } from "./noise";

export const terraformProcessor = noiseProcessor({
  name: "terraform",
  bins: ["terraform", "tofu"],
  keep: (l) => /Error|Warning|Plan:|Apply complete|No changes/.test(l),
  success: (text) => {
    const plan = text.split("\n").filter((l) => /Plan:|Apply complete|No changes/.test(l));
    return (plan.join("\n") || "[terraform output collapsed]") + "\n";
  },
});
