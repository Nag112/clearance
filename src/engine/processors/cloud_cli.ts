import { noiseProcessor } from "./noise";

export const cloudCliProcessor = noiseProcessor({
  name: "cloud_cli",
  bins: ["aws", "gcloud", "az"],
  keep: (l) => /error|AccessDenied|Invalid/i.test(l),
});
