import { defineRailway, github, project, service } from "railway/iac";

// Railway Infrastructure as Code for the "Application" service (replaces
// railway.json). Railway does not read this file during deploys: changes take
// effect only when `railway config apply` writes them to the service. Preview
// first with `railway config plan`.
//
// Named partial: this file manages only the resources it declares. The
// Postgres service is deliberately left out and stays untouched. Without the
// partial export, an apply would treat Postgres as removed.
export const partial = "Application";

export default defineRailway(() => {
  // Removing a field is not "leave it alone": without `source` an apply
  // disconnects the GitHub repo (no more deploys from main), and without
  // `deploy` it turns off app sleeping. Check the plan after any edit.
  const Application = service("Application", {
    source: github("herquiloidehele/invitation-system", { branch: "main" }),
    // The heap cap covers `prisma generate` only (shell `VAR=x a && b`). Leave
    // `next build` uncapped: its type check runs tsc in a subprocess that
    // needs ~1.2 GB.
    build:
      "NODE_OPTIONS=--max-old-space-size=1024 prisma generate && next build",
    start:
      "NODE_OPTIONS='--max-old-space-size=512 --max-semi-space-size=16' next start",
    // Production migrations run only here (see AGENTS.md). A failing
    // migration stops the deploy and the previous deployment keeps serving.
    preDeploy: "prisma migrate deploy",
    replicas: { sfo: 1 },
    deploy: { sleepApplication: true },
    domains: ["convites.brindealstudio.com"],
    networking: { privateNetworkEndpoint: "invitation-system" },
  });

  return project("Brindeal Studio", {
    // Service variables stay managed in the Railway dashboard, as before.
    // Required: without it the CLI treats variables as managed by this file.
    // (SDK 3.16.0's types don't declare `variables` yet; the CLI reads it.)
    variables: { managed: false },
    resources: [Application],
  });
});
