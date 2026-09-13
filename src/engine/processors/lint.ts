import { commandIs } from "../match";
import { keepLines } from "../lines";
import type { Processor } from "../processor";

export const lintProcessor: Processor = {
  name: "lint",
  handlesFailure: true,
  canHandle(input) {
    return commandIs(input.command, ["ruff", "eslint", "pylint", "flake8", "rubocop", "stylelint"]);
  },
  process(input) {
    const counts = new Map<string, { count: number; examples: string[] }>();
    for (const line of input.text.split("\n")) {
      const m = line.match(/\b([A-Z]\d{3,4})\b/) || line.match(/\b([a-z]+\/[a-z0-9-]+)\b/);
      if (!m || !/[0-9]|error|warning/i.test(line)) {
        continue;
      }
      const id = m[1];
      const rec = counts.get(id) ?? { count: 0, examples: [] };
      rec.count += 1;
      if (rec.examples.length < 2) {
        rec.examples.push(line.trim());
      }
      counts.set(id, rec);
    }
    if (counts.size === 0) {
      return { text: keepLines(input.text, (l) => /error|warning|found/i.test(l)) };
    }
    const parts = [`${[...counts.values()].reduce((a, b) => a + b.count, 0)} issues across ${counts.size} rules:`];
    for (const [id, rec] of counts) {
      parts.push(`  ${id}: ${rec.count} occurrences`);
      for (const ex of rec.examples) {
        parts.push(`    ${ex}`);
      }
      if (rec.count > rec.examples.length) {
        parts.push(`    ... (${rec.count - rec.examples.length} more)`);
      }
    }
    return { text: parts.join("\n") + "\n" };
  },
};
