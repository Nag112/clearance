import { commandIs } from "../match";
import { isErrorish, keepLines } from "../lines";
import type { Processor } from "../processor";

export const testProcessor: Processor = {
  name: "test",
  handlesFailure: true,
  canHandle(input) {
    return (
      commandIs(input.command, ["pytest", "py.test", "jest", "vitest", "mocha", "go"]) &&
      (/\btest\b/.test(input.command) || commandIs(input.command, ["pytest", "py.test", "jest", "vitest", "mocha"]))
    );
  },
  process(input) {
    const lines = input.text.split("\n");
    const failed = lines.filter((l) => /FAILED|FAIL |✕|×|●|Error|AssertionError|Traceback/.test(l));
    const passed = lines.filter((l) => /PASSED|✓|√|ok |PASS/.test(l) && !/FAILED/.test(l)).length;
    const summary = lines.filter((l) => /passed|failed|error/i.test(l) && /(=+|Test Suites|Tests:)/.test(l));
    if (/\bfailed\b/i.test(input.text) || failed.length) {
      const body = keepLines(input.text, (l) => isErrorish(l) || /FAILED|FAIL |E\s+|Error|Traceback|Assertion/.test(l));
      const head = passed ? `[${passed} tests passed]\n` : "";
      return { text: head + body };
    }
    const count = lines.filter((l) => /PASSED|✓|PASS/.test(l)).length;
    if (count > 0) {
      return { text: `[${count} tests passed]\n${summary.slice(-1).join("\n")}\n` };
    }
    return { text: input.text };
  },
};
