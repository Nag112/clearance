import type { Processor } from "../processor";

export const structuredLogProcessor: Processor = {
  name: "structured_log",
  canHandle(input) {
    const sample = input.text.trim().slice(0, 500);
    return sample.startsWith("{") && /"level"\s*:/.test(sample);
  },
  process(input) {
    const kept = input.text.split("\n").filter((l) => /"level"\s*:\s*"(error|warn|warning|fatal)"/i.test(l));
    const omitted = input.text.split("\n").length - kept.length;
    if (kept.length === 0) {
      return { text: `[clearance] ${omitted} structured log line(s) omitted (no error/warn)\n` };
    }
    return { text: `${kept.join("\n")}\n[clearance] ${omitted} structured log line(s) omitted\n` };
  },
};
