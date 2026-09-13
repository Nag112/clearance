import { noiseProcessor } from "./noise";

export const syslogProcessor = noiseProcessor({
  name: "syslog",
  bins: ["journalctl", "dmesg"],
  keep: (l) => /error|warn|fail|panic/i.test(l),
});
