import { runInvitationBuild } from "./run-build";

async function main() {
  const [slug, ...rest] = process.argv.slice(2);
  const designPrompt = rest.join(" ").trim();
  if (!slug || !designPrompt) {
    console.error(
      'Usage: npx tsx worker/build-for-invitation.ts <slug> "<design prompt>"',
    );
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    process.exit(1);
  }

  const { ok } = await runInvitationBuild({
    slug,
    prompt: designPrompt,
    onEvent: (e) => console.log(JSON.stringify(e)),
  });
  process.exit(ok ? 0 : 2);
}

void main();
