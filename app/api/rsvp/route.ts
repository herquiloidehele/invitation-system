import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const rsvpSchema = z.object({
  invitationSlug: z.string().min(1, "Slug do convite é obrigatório"),
  guestName: z.string().min(1, "Nome é obrigatório"),
  email: z.email("Email inválido").optional(),
  attending: z.boolean({ error: "Confirmação de presença é obrigatória" }),
  guestsCount: z.number().int().min(1).max(10).optional().default(1),
  dietaryRestrictions: z.string().optional(),
  message: z.string().optional(),
});

type RSVPEntry = z.infer<typeof rsvpSchema> & {
  submittedAt: string;
};

// ---------------------------------------------------------------------------
// File-based storage helpers (V1 — no database)
// ---------------------------------------------------------------------------

const DATA_DIR = join(process.cwd(), "data");
const RSVP_FILE = join(DATA_DIR, "rsvps.json");

async function readRsvps(): Promise<RSVPEntry[]> {
  try {
    const raw = await readFile(RSVP_FILE, "utf-8");
    return JSON.parse(raw) as RSVPEntry[];
  } catch {
    return [];
  }
}

async function writeRsvp(entry: RSVPEntry): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const existing = await readRsvps();
  existing.push(entry);
  await writeFile(RSVP_FILE, JSON.stringify(existing, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// POST /api/rsvp
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = rsvpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados inválidos",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const entry: RSVPEntry = {
      ...result.data,
      submittedAt: new Date().toISOString(),
    };

    // Log to console for debugging
    console.log("[RSVP]", JSON.stringify(entry, null, 2));

    // Persist to local JSON file
    await writeRsvp(entry);

    return NextResponse.json({
      success: true,
      message: "RSVP confirmado!",
    });
  } catch (error) {
    console.error("[RSVP] Error processing request:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
