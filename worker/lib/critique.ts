import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { artDirection } from "./art-direction";

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

/**
 * The same shape, graded against a supplied design reference instead of against
 * the genre's defaults. Only the descriptions differ — they are what the model
 * actually reads, so a build that reproduces a centred, gradient-lit reference
 * is not marked down for being exactly what was asked for.
 */
export const FidelityCritiqueSchema = z.object({
  score: z
    .number()
    .min(1)
    .max(10)
    .describe(
      "Fidelity to the reference. 1 = bears no relation to it, 10 = indistinguishable from it once reflowed to a phone and filled with this couple's real content.",
    ),
  verdict: z
    .enum(["ship", "revise"])
    .describe(
      '"ship" only if score >= 8 AND there is no high-severity difference.',
    ),
  issues: z
    .array(
      z.object({
        severity: z.enum(["high", "medium", "low"]),
        what: z
          .string()
          .describe(
            "What differs from the reference, as seen in the images. One sentence.",
          ),
        fix: z
          .string()
          .describe(
            "The concrete change that closes the gap. One sentence, specific values where possible.",
          ),
      }),
    )
    .max(6),
});

export type Critique = z.infer<typeof CritiqueSchema>;

/** Media types the Messages API accepts for an image block. */
export type ReferenceMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

export interface CritiqueReference {
  data: Buffer;
  mediaType: ReferenceMediaType;
}

/**
 * The reviewer's instruction. Pure, and exported, because which rubric a build
 * is graded against is the whole point of the replication work — it is worth a
 * test, and the model call around it is not.
 *
 * With a reference present the art direction's TASTE rules are deliberately
 * absent — they are the rubric for a design nobody specified, and applying them
 * here would ask the reviewer to penalise the very thing the build was told to
 * do. Its short `replicating` form still runs: lorem text and an unbound section
 * are defects whoever chose the design.
 */
export function critiqueInstruction(args: {
  shotCount: number;
  referenceCount: number;
  brief: string;
  width?: number | null;
}): string {
  const laidOut = args.width ? ` (laid out ${args.width}px wide)` : "";
  const seeing =
    "Judge only what you can SEE. A transparent gap where an image should be is a capture limitation, not a design flaw — ignore it.";

  if (args.referenceCount > 0) {
    const first =
      args.referenceCount === 1
        ? "The first image is the design reference this build was told to reproduce."
        : `The first ${args.referenceCount} images are the design reference this build was told to reproduce.`;
    return [
      "You are reviewing a digital invitation built to reproduce a design reference.",
      first,
      `The remaining ${args.shotCount} are the built invitation — the PHONE layout${laidOut}, top-to-bottom in order.`,
      seeing,
      "",
      args.brief,
      "",
      "Report what DIFFERS from the reference, most visible first: colour, type",
      "(family, scale, weight, tracking, case), spacing, shape, composition,",
      "section order, imagery treatment. Name the value you see and the value the",
      "reference shows.",
      "",
      "These are licensed, and are NOT differences:",
      "- The reflow to a phone column. A multi-column reference becomes one column;",
      "  proportion and hierarchy matter, an exact width does not.",
      "- The real content — this couple's names, dates, places and language in",
      "  place of whatever the reference showed.",
      "- A photograph standing in for one in the reference, as long as subject,",
      "  crop and tone match.",
      "- A substituted typeface where the reference's own is not loadable. Judge",
      "  how well it matches, not the fact of the substitution.",
      "- Sections the reference does not contain at all. Judge those on whether",
      "  they use the reference's own colour, type scale and shapes.",
      "",
      "Do not suggest improvements to the design. Closing the gap is the only goal.",
      "Report at most 6 differences, each with a concrete fix. Do not praise.",
      "",
      artDirection({ replicating: true }),
    ].join("\n");
  }

  return [
    `You are reviewing a digital invitation that was just built. ${args.shotCount} images are attached:`,
    `the PHONE layout${laidOut}, top-to-bottom in order. Guests open invitations on a phone; that is the layout that matters.`,
    seeing,
    "",
    args.brief,
    "",
    "Check, in this order: (1) nothing violates the art direction below; (2) hierarchy",
    "— does one element per screen dominate; (3) the phone layout is not a",
    "shrunken desktop. Report at most 6 issues, most severe first, each with a",
    "concrete fix. Do not praise.",
    "",
    artDirection(),
  ].join("\n");
}

type ImageBlock = {
  type: "image";
  source: { type: "base64"; media_type: ReferenceMediaType; data: string };
};
type TextBlock = { type: "text"; text: string };

/**
 * The message content: the reference first, so "the first N images" in the
 * instruction means what it says, then the build's own tiles, then the text.
 */
export function critiqueContent(args: {
  images: Array<{ jpeg: Buffer }>;
  references: CritiqueReference[];
  instruction: string;
}): Array<ImageBlock | TextBlock> {
  const image = (data: Buffer, mediaType: ReferenceMediaType): ImageBlock => ({
    type: "image",
    source: { type: "base64", media_type: mediaType, data: data.toString("base64") },
  });

  return [
    ...args.references.map((r) => image(r.data, r.mediaType)),
    ...args.images.map((i) => image(i.jpeg, "image/jpeg")),
    { type: "text", text: args.instruction },
  ];
}

/**
 * Judge the RENDERED invitation. This is the harness-driven self-critique the
 * spec deferred: the images come from the real preview, and a fresh pair of
 * eyes judges them — the builder does not grade its own homework.
 *
 * `references` switches the whole exercise: with a design the build was told to
 * reproduce, the question stops being "is this generic?" and becomes "what
 * differs from the reference?" — rubric and schema both.
 */
export async function critiqueDesign(args: {
  /** Phone tiles, top-to-bottom. */
  images: Array<{
    jpeg: Buffer;
    /** CSS px the page was laid out at, when the capture knows it. */
    width?: number | null;
  }>;
  brief: string;
  /** The design files this revision replicated, if any. */
  references?: CritiqueReference[];
}): Promise<Critique> {
  const client = new Anthropic();
  const references = args.references ?? [];
  const instruction = critiqueInstruction({
    shotCount: args.images.length,
    referenceCount: references.length,
    brief: args.brief,
    width: args.images.find((i) => i.width)?.width,
  });

  const content = critiqueContent({
    images: args.images,
    references,
    instruction,
  });

  const response = await client.messages.parse({
    model: process.env.AI_CRITIQUE_MODEL ?? "claude-opus-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: content as never }],
    output_config: {
      format: zodOutputFormat(
        references.length > 0 ? FidelityCritiqueSchema : CritiqueSchema,
      ),
    },
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
