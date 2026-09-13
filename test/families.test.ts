import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { actProcessor } from "../src/engine/processors/act";
import { ansibleProcessor } from "../src/engine/processors/ansible";
import { bunProcessor } from "../src/engine/processors/bun";
import { cdktfProcessor } from "../src/engine/processors/cdktf";
import { cloudCliProcessor } from "../src/engine/processors/cloud_cli";
import { dbQueryProcessor } from "../src/engine/processors/db_query";
import { ghProcessor } from "../src/engine/processors/gh";
import { goProcessor } from "../src/engine/processors/go";
import { helmProcessor } from "../src/engine/processors/helm";
import { jqYqProcessor } from "../src/engine/processors/jq_yq";
import { justProcessor } from "../src/engine/processors/just";
import { kubectlProcessor } from "../src/engine/processors/kubectl";
import { mavenGradleProcessor } from "../src/engine/processors/maven_gradle";
import { miseProcessor } from "../src/engine/processors/mise";
import { networkProcessor } from "../src/engine/processors/network";
import { nixProcessor } from "../src/engine/processors/nix";
import { pulumiProcessor } from "../src/engine/processors/pulumi";
import { searchProcessor } from "../src/engine/processors/search";
import { sshProcessor } from "../src/engine/processors/ssh";
import { structuredLogProcessor } from "../src/engine/processors/structured_log";
import { syslogProcessor } from "../src/engine/processors/syslog";
import { systemInfoProcessor } from "../src/engine/processors/system_info";
import { terraformProcessor } from "../src/engine/processors/terraform";
import { withProcessor } from "./helpers";

describe("remaining processor families", () => {
  it("go keeps FAIL", () => {
    const out = withProcessor(goProcessor).compress({
      command: "go build",
      text: "# pkg\nok\nFAIL\n",
      exitCode: 1,
    });
    assert.match(out.text, /FAIL/);
  });
  it("bun keeps Failed", () => {
    const out = withProcessor(bunProcessor).compress({
      command: "bun install",
      text: "Failed to resolve package foo\n",
      exitCode: 1,
    });
    assert.match(out.text, /Failed to resolve/);
  });
  it("network collapses curl progress", () => {
    const text = Array.from({ length: 50 }, (_, i) => `${i}%`).join("\n") + "\n100% saved\n";
    const out = withProcessor(networkProcessor).compress({ command: "curl -O x", text });
    assert.match(out.text, /Download complete/);
  });
  it("kubectl keeps Error", () => {
    const out = withProcessor(kubectlProcessor).compress({
      command: "kubectl get pods",
      text: "Error from server (Forbidden)\n",
      exitCode: 1,
    });
    assert.match(out.text, /Forbidden/);
  });
  it("terraform keeps Plan summary", () => {
    const out = withProcessor(terraformProcessor).compress({
      command: "terraform plan",
      text: "Refreshing state...\nPlan: 1 to add, 0 to change, 0 to destroy.\n",
    });
    assert.match(out.text, /Plan: 1 to add/);
  });
  it("pulumi keeps Resources", () => {
    const out = withProcessor(pulumiProcessor).compress({
      command: "pulumi up",
      text: "updating...\nResources:\n    2 unchanged\nDuration: 5s\n",
    });
    assert.match(out.text, /Resources:/);
  });
  it("cdktf keeps error", () => {
    const out = withProcessor(cdktfProcessor).compress({
      command: "cdktf synth",
      text: "Error: synth failed\n",
      exitCode: 1,
    });
    assert.match(out.text, /synth failed/);
  });
  it("nix keeps error", () => {
    const out = withProcessor(nixProcessor).compress({
      command: "nix build",
      text: "error: builder failed\n",
      exitCode: 1,
    });
    assert.match(out.text, /builder failed/);
  });
  it("mise keeps error", () => {
    const out = withProcessor(miseProcessor).compress({
      command: "mise install",
      text: "error: plugin missing\n",
      exitCode: 1,
    });
    assert.match(out.text, /plugin missing/);
  });
  it("search truncates with marker", () => {
    const text = Array.from({ length: 50 }, (_, i) => `file.ts:${i}:hit`).join("\n");
    const out = withProcessor(searchProcessor).compress({ command: "rg hit", text });
    assert.match(out.text, /search hit\(s\) omitted/);
  });
  it("system_info truncates", () => {
    const text = Array.from({ length: 40 }, (_, i) => `proc ${i}`).join("\n");
    const out = withProcessor(systemInfoProcessor).compress({ command: "ps aux", text });
    assert.match(out.text, /system_info line\(s\) omitted/);
  });
  it("gh truncates", () => {
    const text = Array.from({ length: 40 }, (_, i) => `#${i} title`).join("\n");
    const out = withProcessor(ghProcessor).compress({ command: "gh issue list", text });
    assert.match(out.text, /gh line\(s\) omitted/);
  });
  it("db_query truncates rows", () => {
    const text = Array.from({ length: 40 }, (_, i) => `(${i}, 'x')`).join("\n");
    const out = withProcessor(dbQueryProcessor).compress({ command: "psql -c select", text });
    assert.match(out.text, /result row\(s\) omitted/);
  });
  it("cloud_cli keeps AccessDenied", () => {
    const out = withProcessor(cloudCliProcessor).compress({
      command: "aws s3 ls",
      text: "An error occurred (AccessDenied) when calling ListBuckets\n",
      exitCode: 1,
    });
    assert.match(out.text, /AccessDenied/);
  });
  it("ansible keeps FAILED", () => {
    const out = withProcessor(ansibleProcessor).compress({
      command: "ansible-playbook site.yml",
      text: "fatal: [host]: FAILED! => {}\nPLAY RECAP host ok=1 failed=1\n",
      exitCode: 2,
    });
    assert.match(out.text, /FAILED/);
  });
  it("helm keeps Error", () => {
    const out = withProcessor(helmProcessor).compress({
      command: "helm install x",
      text: "Error: INSTALLATION FAILED\n",
      exitCode: 1,
    });
    assert.match(out.text, /INSTALLATION FAILED/);
  });
  it("syslog keeps error", () => {
    const out = withProcessor(syslogProcessor).compress({
      command: "journalctl -xe",
      text: "debug noise\nkernel: error timeout\n",
    });
    assert.match(out.text, /error timeout/);
  });
  it("ssh drops motd", () => {
    const out = withProcessor(sshProcessor).compress({
      command: "ssh host",
      text: "Welcome to Ubuntu\nLast login: yesterday\n$ ls\n",
    });
    assert.doesNotMatch(out.text, /Welcome to Ubuntu/);
  });
  it("jq_yq truncates", () => {
    const text = Array.from({ length: 120 }, () => "{").join("\n");
    const out = withProcessor(jqYqProcessor).compress({ command: "jq . file.json", text });
    assert.match(out.text, /jq\/yq line\(s\) omitted/);
  });
  it("just keeps error", () => {
    const out = withProcessor(justProcessor).compress({
      command: "just build",
      text: "error: Recipe `build` failed\n",
      exitCode: 1,
    });
    assert.match(out.text, /Recipe/);
  });
  it("act keeps error", () => {
    const out = withProcessor(actProcessor).compress({
      command: "act",
      text: "Error: workflow failed\n",
      exitCode: 1,
    });
    assert.match(out.text, /workflow failed/);
  });
  it("structured_log keeps error level", () => {
    const text = '{"level":"info","msg":"n"}\n{"level":"error","msg":"boom"}\n';
    const out = withProcessor(structuredLogProcessor).compress({ command: "cat app.log", text });
    assert.match(out.text, /boom/);
    assert.doesNotMatch(out.text, /"info"/);
  });
  it("maven_gradle keeps BUILD FAILED", () => {
    const out = withProcessor(mavenGradleProcessor).compress({
      command: "mvn test",
      text: "FAILURE: Build failed with an exception.\nBUILD FAILED\n",
      exitCode: 1,
    });
    assert.match(out.text, /BUILD FAILED/);
  });
});
