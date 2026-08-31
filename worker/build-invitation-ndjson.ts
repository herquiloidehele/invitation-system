import { runInvitationBuild } from "./run-build";
import type { Direction } from "./lib/directions";

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
  if (optionsJson) {
    try {
      const o = JSON.parse(optionsJson) as {
        direction?: Direction | null;
        refineDirections?: string | null;
      };
      direction = o.direction ?? null;
      refineDirections = o.refineDirections ?? null;
    } catch {
      // ignore malformed options — behave like a plain build
    }
  }

  const { ok } = await runInvitationBuild({
    slug,
    prompt,
    direction,
    refineDirections,
    onEvent: (e) => process.stdout.write(JSON.stringify(e) + "\n"),
  });
  process.exit(ok ? 0 : 2);
}

void main();
