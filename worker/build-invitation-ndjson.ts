import { runInvitationBuild } from "./run-build";
import type { Critique } from "./lib/critique";
import type { SelectedElementDescriptor } from "@/lib/ai-preview-select";

type SelectionArg = {
  descriptor: SelectedElementDescriptor;
  imagePath: string | null;
};

async function main() {
  const [slug, prompt, optionsJson] = process.argv.slice(2);
  if (!slug || !prompt || !process.env.ANTHROPIC_API_KEY) {
    process.stdout.write(
      JSON.stringify({ kind: "error", message: "bad args or missing key" }) +
        "\n",
    );
    process.exit(1);
  }

  let critique: Critique | null = null;
  let selection: SelectionArg | null = null;
  if (optionsJson) {
    try {
      const o = JSON.parse(optionsJson) as {
        critique?: Critique | null;
        selection?: SelectionArg | null;
      };
      critique = o.critique ?? null;
      selection = o.selection ?? null;
    } catch {
      // ignore malformed options — behave like a plain build
    }
  }

  const { ok } = await runInvitationBuild({
    slug,
    prompt,
    critique,
    selection,
    onEvent: (e) => process.stdout.write(JSON.stringify(e) + "\n"),
  });
  process.exit(ok ? 0 : 2);
}

void main();
