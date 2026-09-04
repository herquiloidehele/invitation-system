import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { artDirection } from "./art-direction";
import { type Direction, directionToPrompt } from "./directions";

export const CritiqueSchema = z.object({
  score: z
    .number()
    .min(1)
    .max(10)
    .describe(
      "1 = generic template, 10 = a designer made it for these people.",
    ),
  verdict: z
    .enum(["ship", "revise"])
    .describe('"ship" only if score >= 8 AND there is no high-severity issue.'),
  issues: z
    .array(
      z.object({
        severity: z.enum(["high", "medium", "low"]),
        what: z
          .string()
          .describe("What is wrong, as seen in the images. One sentence."),
        fix: z
          .string()
          .describe(
            "The concrete change to make. One sentence, specific values where possible.",
          ),
      }),
    )
    .max(6),
});

export type Critique = z.infer<typeof CritiqueSchema>;

/**
 * Judge the RENDERED invitation. This is the harness-driven self-critique the
 * spec deferred: the images come from the real preview, and a fresh pair of
 * eyes judges them — the builder does not grade its own homework.
 */
export async function critiqueDesign(args: {
  /** Phone tiles, top-to-bottom. */
  images: Array<{
    jpeg: Buffer;
    /** CSS px the page was laid out at, when the capture knows it. */
    width?: number | null;
  }>;
  direction: Direction | null;
  brief: string;
}): Promise<Critique> {
  const client = new Anthropic();
  const width = args.images.find((i) => i.width)?.width;
  const instruction = [
    `You are reviewing a digital invitation that was just built. ${args.images.length} images are attached:`,
    `the PHONE layout${width ? ` (laid out ${width}px wide)` : ""}, top-to-bottom in order. Guests open invitations on a phone; that is the layout that matters.`,
    "Judge only what you can SEE. A transparent gap where an image should be is a capture limitation, not a design flaw — ignore it.",
    "",
    args.brief,
    "",
    args.direction ? directionToPrompt(args.direction) : "",
    "",
    "Check, in this order: (1) every signature detail of the chosen direction is",
    "actually visible; (2) nothing violates the art direction below; (3) hierarchy",
    "— does one element per screen dominate; (4) the phone layout is not a",
    "shrunken desktop. Report at most 6 issues, most severe first, each with a",
    "concrete fix. Do not praise. Do not suggest a different direction.",
    "",
    artDirection(),
  ].join("\n");

  const content = [
    ...args.images.map((i) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: "image/jpeg" as const,
        data: i.jpeg.toString("base64"),
      },
    })),
    { type: "text" as const, text: instruction },
  ];

  const response = await client.messages.parse({
    model: process.env.AI_CRITIQUE_MODEL ?? "claude-opus-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: content as never }],
    output_config: { format: zodOutputFormat(CritiqueSchema) },
  });

  return response.parsed_output ?? { score: 5, verdict: "ship", issues: [] };
}

/** The critique as a build instruction for the same agent session. */
export function critiqueToPrompt(c: Critique): string {
  const order = { high: 0, medium: 1, low: 2 };
  const sorted = [...c.issues].sort(
    (a, b) => order[a.severity] - order[b.severity],
  );
  return [
    `A review of the rendered result scored it ${c.score}/10. Apply these fixes, in order:`,
    ...sorted.map((i, n) => `${n + 1}. [${i.severity}] ${i.what} → ${i.fix}`),
    "",
    "Edit only the files that own each fix. Do NOT redesign, do NOT change the",
    "direction, do NOT touch anything not listed. Then run `npm run build` once.",
  ].join("\n");
}
