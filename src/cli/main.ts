#!/usr/bin/env node
import { execCompressed } from "./exec";

function main(argv: string[]): number {
  if (argv[0] === "exec" && argv[1] === "--") {
    argv = argv.slice(2);
  } else if (argv[0] === "exec") {
    argv = argv.slice(1);
  } else {
    process.stderr.write("usage: clearance exec -- <command> [args...]\n");
    return 2;
  }
  const result = execCompressed(argv);
  if (result.stdout) {
    process.stdout.write(result.stdout.endsWith("\n") ? result.stdout : `${result.stdout}\n`);
  }
  return result.status;
}

process.exit(main(process.argv.slice(2)));
