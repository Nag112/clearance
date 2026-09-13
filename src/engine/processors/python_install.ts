import { commandIs } from "../match";
import { isErrorish, keepLines } from "../lines";
import type { Processor } from "../processor";

export const pythonInstallProcessor: Processor = {
  name: "python_install",
  handlesFailure: true,
  canHandle(input) {
    return (
      (commandIs(input.command, ["pip", "pip3", "uv", "poetry"]) && /\b(install|add|sync)\b/.test(input.command)) ||
      /pip install/.test(input.command)
    );
  },
  process(input) {
    if (isErrorish(input.text)) {
      return { text: keepLines(input.text, (l) => isErrorish(l) || /ERROR:/.test(l)) };
    }
    const added = input.text.split("\n").filter((l) => /Successfully installed|Added /.test(l));
    return { text: (added.slice(-3).join("\n") || "Install succeeded.") + "\n" };
  },
};
