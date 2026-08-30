import { runInvitationBuild } from "./run-build";

async function main() {
  const [slug, ...rest] = process.argv.slice(2);
  const prompt = rest.join(" ").trim();
  if (!slug || !prompt || !process.env.ANTHROPIC_API_KEY) {
    process.stdout.write(
      JSON.stringify({ kind: "error", message: "bad args or missing key" }) +
        "\n",
    );
    process.exit(1);
  }
  const { ok } = await runInvitationBuild({
    slug,
    prompt,
    onEvent: (e) => process.stdout.write(JSON.stringify(e) + "\n"),
  });
  process.exit(ok ? 0 : 2);
}

void main();
