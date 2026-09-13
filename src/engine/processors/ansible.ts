import { noiseProcessor } from "./noise";

export const ansibleProcessor = noiseProcessor({
  name: "ansible",
  bins: ["ansible", "ansible-playbook"],
  keep: (l) => /FAILED|ERROR|fatal:|ok=/.test(l),
  success: (text) => {
    const recap = text.split("\n").filter((l) => /PLAY RECAP|failed=|ok=/.test(l));
    const failed = text.split("\n").filter((l) => /FAILED|fatal:/.test(l));
    return [...failed, ...recap].join("\n") + "\n";
  },
});
