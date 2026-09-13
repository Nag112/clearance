import { commandIs, commandMatches } from "../match";
import type { Processor } from "../processor";

const SECRET_NAME =
  /(?:^|_)(?:SECRET|PASSWORD|CREDENTIAL|API_KEY|GITHUB_TOKEN)(?:_|$)|(?:^|_)(?:KEY|TOKEN|AUTH|PWD)$/i;

const PASSTHROUGH_ENV = /(^|[\s'"])(?:cat|head|tail)\s+[^\n]*\.env(?:\.example|\.template)?(?:\s|$)/;

const REDACT_ENV_FILE = /(^|[\s'"])(?:cat|head|tail)\s+[^\n]*\.env\.[A-Za-z0-9._-]+/;

export const envProcessor: Processor = {
  name: "env",
  handlesFailure: true,
  canHandle(input) {
    if (commandIs(input.command, ["printenv", "env"])) {
      return true;
    }
    if (REDACT_ENV_FILE.test(input.command) && !PASSTHROUGH_ENV.test(input.command)) {
      return true;
    }
    if (commandMatches(input.command, /\benv\b|\bprintenv\b/)) {
      return true;
    }
    return false;
  },
  process(input) {
    if (/(?:^|[\s'"])(?:cat|head|tail)\s+[^\n]*\.env(?:\.example|\.template)?(?:\s|$)/.test(input.command)
      && !/\.env\.[A-Za-z]/.test(input.command)) {
      return { text: input.text };
    }
    let redacted = false;
    const text = input.text
      .split("\n")
      .map((line) => {
        const eq = line.indexOf("=");
        if (eq <= 0) {
          return line;
        }
        const key = line.slice(0, eq).trim();
        if (SECRET_NAME.test(key.replace(/^export\s+/, ""))) {
          redacted = true;
          return `${line.slice(0, eq)}=***`;
        }
        return line;
      })
      .join("\n");
    return { text, redacted };
  },
};
