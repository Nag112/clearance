import { CompressionEngine } from "./engine";
import type { Processor } from "./processor";
import { actProcessor } from "./processors/act";
import { ansibleProcessor } from "./processors/ansible";
import { bunProcessor } from "./processors/bun";
import { buildProcessor } from "./processors/build";
import { cargoProcessor } from "./processors/cargo";
import { cdktfProcessor } from "./processors/cdktf";
import { cloudCliProcessor } from "./processors/cloud_cli";
import { dbQueryProcessor } from "./processors/db_query";
import { dockerProcessor } from "./processors/docker";
import { envProcessor } from "./processors/env";
import { fileContentProcessor } from "./processors/file_content";
import { fileListingProcessor } from "./processors/file_listing";
import { genericProcessor } from "./processors/generic";
import { ghProcessor } from "./processors/gh";
import { gitProcessor } from "./processors/git";
import { goProcessor } from "./processors/go";
import { helmProcessor } from "./processors/helm";
import { jqYqProcessor } from "./processors/jq_yq";
import { justProcessor } from "./processors/just";
import { kubectlProcessor } from "./processors/kubectl";
import { lintProcessor } from "./processors/lint";
import { mavenGradleProcessor } from "./processors/maven_gradle";
import { miseProcessor } from "./processors/mise";
import { networkProcessor } from "./processors/network";
import { nixProcessor } from "./processors/nix";
import { packageListProcessor } from "./processors/package_list";
import { pulumiProcessor } from "./processors/pulumi";
import { pythonInstallProcessor } from "./processors/python_install";
import { searchProcessor } from "./processors/search";
import { sshProcessor } from "./processors/ssh";
import { structuredLogProcessor } from "./processors/structured_log";
import { syslogProcessor } from "./processors/syslog";
import { systemInfoProcessor } from "./processors/system_info";
import { terraformProcessor } from "./processors/terraform";
import { testProcessor } from "./processors/test";

/** Specialists first; generic always last. */
export const PROCESSORS: Processor[] = [
  fileContentProcessor,
  gitProcessor,
  testProcessor,
  lintProcessor,
  packageListProcessor,
  pythonInstallProcessor,
  mavenGradleProcessor,
  bunProcessor,
  cargoProcessor,
  goProcessor,
  buildProcessor,
  dockerProcessor,
  networkProcessor,
  kubectlProcessor,
  terraformProcessor,
  pulumiProcessor,
  cdktfProcessor,
  nixProcessor,
  miseProcessor,
  envProcessor,
  searchProcessor,
  systemInfoProcessor,
  ghProcessor,
  dbQueryProcessor,
  cloudCliProcessor,
  ansibleProcessor,
  helmProcessor,
  syslogProcessor,
  sshProcessor,
  jqYqProcessor,
  justProcessor,
  actProcessor,
  structuredLogProcessor,
  fileListingProcessor,
  genericProcessor,
];

export function createDefaultEngine(): CompressionEngine {
  const engine = new CompressionEngine();
  for (const processor of PROCESSORS) {
    engine.register(processor);
  }
  return engine;
}
