import { commandIs } from "../match";
import type { Processor } from "../processor";

const CONTEXT = 3;
const LOCKFILE = /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|poetry\.lock|go\.sum)$/;

function trimDiff(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let inLock = false;
  let contextRun: string[] = [];

  const flushContext = (keepAll: boolean) => {
    if (keepAll) {
      out.push(...contextRun);
    } else if (contextRun.length > CONTEXT * 2) {
      out.push(...contextRun.slice(0, CONTEXT));
      out.push(` [clearance] ${contextRun.length - CONTEXT * 2} unchanged context line(s) omitted`);
      out.push(...contextRun.slice(-CONTEXT));
    } else {
      out.push(...contextRun);
    }
    contextRun = [];
  };

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      flushContext(true);
      inLock = LOCKFILE.test(line);
      out.push(line);
      continue;
    }
    if (line.startsWith("index ") || line.startsWith("similarity index ")) {
      continue;
    }
    if (inLock && (line.startsWith("+") || line.startsWith("-") || line.startsWith(" "))) {
      continue;
    }
    if (line.startsWith("@@") || line.startsWith("+") || line.startsWith("-")) {
      flushContext(false);
      out.push(line);
      continue;
    }
    if (line.startsWith(" ")) {
      contextRun.push(line);
      continue;
    }
    flushContext(true);
    out.push(line);
  }
  flushContext(true);
  return out.join("\n");
}

function trimLog(text: string, max = 20): string {
  const lines = text.split("\n").filter((l) => l.length > 0);
  if (lines.length <= max) {
    return text;
  }
  return `${lines.slice(0, max).join("\n")}\n[clearance] ${lines.length - max} commit line(s) omitted\n`;
}

export const gitProcessor: Processor = {
  name: "git",
  canHandle(input) {
    return commandIs(input.command, ["git"]) || input.command.trim().startsWith("git ");
  },
  process(input) {
    const cmd = input.command;
    if (/\bdiff\b/.test(cmd) && /\b--stat\b/.test(cmd)) {
      const lines = input.text.trim().split("\n");
      const summary = lines.filter((l) => /files? changed/.test(l));
      return { text: summary.join("\n") + (summary.length ? "\n" : input.text) };
    }
    if (/\b(diff|show)\b/.test(cmd)) {
      return { text: trimDiff(input.text) };
    }
    if (/\blog\b/.test(cmd)) {
      return { text: trimLog(input.text) };
    }
    return { text: input.text };
  },
};
