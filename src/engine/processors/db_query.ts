import { commandIs } from "../match";
import type { Processor } from "../processor";

export const dbQueryProcessor: Processor = {
  name: "db_query",
  handlesFailure: true,
  canHandle(input) {
    return commandIs(input.command, ["psql", "mysql", "sqlite3", "redis-cli"]);
  },
  process(input) {
    if (/ERROR:/.test(input.text)) {
      return { text: input.text.split("\n").filter((l) => /ERROR|LINE |DETAIL/.test(l)).join("\n") + "\n" };
    }
    const lines = input.text.split("\n").filter((l) => l.trim());
    const max = 20;
    if (lines.length <= max) {
      return { text: input.text };
    }
    return { text: `${lines.slice(0, max).join("\n")}\n[clearance] ${lines.length - max} result row(s) omitted\n` };
  },
};
