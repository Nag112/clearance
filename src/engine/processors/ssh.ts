import { noiseProcessor } from "./noise";

export const sshProcessor = noiseProcessor({
  name: "ssh",
  bins: ["ssh", "scp"],
  keep: (l) => /error|Permission denied|Could not|failed/i.test(l) && !/Welcome to|Last login|motd/i.test(l),
  success: (text) =>
    text
      .split("\n")
      .filter((l) => !/Welcome to|Last login|Documentation:|motd/i.test(l))
      .join("\n"),
});
