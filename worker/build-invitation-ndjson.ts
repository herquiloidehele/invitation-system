import { runInvitationBuild } from "./run-build";
import type { Direction } from "./lib/directions";
import type { Critique } from "./lib/critique";

async function main() {
  const [slug, prompt, optionsJson] = process.argv.slice(2);
  if (!slug || !prompt || !process.env.ANTHROPIC_API_KEY) {
    process.stdout.write(
      JSON.stringify({ kind: "error", message: "bad args or missing key" }) +
        "\n",
    );
    process.exit(1);
  }

  let direction: Direction | null = null;
  let refineDirections: string | null = null;
  let critique: Critique | null = null;
  if (optionsJson) {
    try {
      const o = JSON.parse(optionsJson) as {
        direction?: Direction | null;
        refineDirections?: string | null;
        critique?: Critique | null;
      };
      direction = o.direction ?? null;
      refineDirections = o.refineDirections ?? null;
      critique = o.critique ?? null;
    } catch {
      // ignore malformed options — behave like a plain build
    }
  }

  const { ok } = await runInvitationBuild({
    slug,
    prompt,
    direction,
    refineDirections,
    critique,
    onEvent: (e) => process.stdout.write(JSON.stringify(e) + "\n"),
  });
  process.exit(ok ? 0 : 2);
}

void main();
