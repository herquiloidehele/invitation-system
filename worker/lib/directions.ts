import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { artDirection } from "./art-direction";

export const DirectionSchema = z.object({
  id: z.string(),
  name: z.string().describe("Short evocative name, max 4 words."),
  palette: z
    .array(z.string())
    .describe(
      "3-5 BARE hex codes, dominant first, e.g. \"#EDE6DA\". No names, no parentheses, no commentary — the value is rendered directly as a CSS colour.",
    ),
  typography: z
    .string()
    .describe(
      'Just the two font family names, e.g. "Fraunces + Karla". No sizing notes.',
    ),
  motion: z.string().describe("One short sentence."),
  composition: z.string().describe("One short sentence."),
  rationale: z.string().describe("One short sentence — why it suits this couple."),
  signatureDetails: z
    .array(z.string())
    .length(3)
    .describe(
      "Exactly 3 concrete, checkable details that make this direction THIS direction — e.g. 'names set in 22vw Fraunces with the ampersand hung into the margin'. Not adjectives.",
    ),
});

export const DirectionsSchema = z.object({
  directions: z.array(DirectionSchema),
});

export type Direction = z.infer<typeof DirectionSchema>;

/**
 * Propose distinct visual directions BEFORE any code exists. A plain Messages
 * API call, not an Agent SDK run: no tools, no workspace, structured JSON out.
 * Opus is used because this step is pure taste and the output is tiny; the
 * build agent stays on Sonnet so its session cache is unaffected.
 */
export async function proposeDirections(args: {
  brief: string;
  prompt: string;
  note?: string | null;
  /** Reference images as base64. Capped by the caller. */
  images?: Array<{ mediaType: string; base64: string }>;
}): Promise<{ directions: Direction[] }> {
  const client = new Anthropic();

  const instruction = [
    "Propose exactly 4 genuinely different visual directions for this invitation.",
    "They must differ in kind — not four variations of one idea. Vary the era,",
    "the compositional logic, and the emotional register.",
    "No code. Each direction is a concise pitch a client could choose between —",
    "these render as small cards, so every field must be short and scannable.",
    "",
    args.brief,
    "",
    `What the client asked for: ${args.prompt}`,
    args.note ? `\nRefine the previous proposals: ${args.note}` : "",
    args.images?.length
      ? "\nReference images are attached. Let them inform palette and mood, but still propose four genuinely different directions — do not describe the same idea four times."
      : "",
    "",
    artDirection(),
  ].join("\n");

  // Images first, then the instruction: the model should look before it reads.
  const content = [
    ...(args.images ?? []).map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mediaType,
        data: img.base64,
      },
    })),
    { type: "text" as const, text: instruction },
  ];

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: content as never }],
    output_config: { format: zodOutputFormat(DirectionsSchema) },
  });

  return { directions: response.parsed_output?.directions ?? [] };
}

/** Render a chosen direction as prompt text for the build agent. */
export function directionToPrompt(d: Direction): string {
  return [
    `Chosen art direction — "${d.name}".`,
    `- Palette: ${d.palette.join(", ")}`,
    `- Typography: ${d.typography}`,
    `- Motion: ${d.motion}`,
    `- Composition: ${d.composition}`,
    `- Why: ${d.rationale}`,
    `- Signature details (all three must be visible in the result):`,
    ...(d.signatureDetails ?? []).map((sd) => `  • ${sd}`),
    `Execute this direction faithfully. Do not substitute a different one.`,
  ].join("\n");
}
