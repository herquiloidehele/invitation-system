import { prisma } from "./db";
import type { ModelRecord } from "./types";

// ---------------------------------------------------------------------------
// Helpers — convert Prisma Model row → ModelRecord
// ---------------------------------------------------------------------------

function toModelRecord(row: {
  id: string;
  name: string;
  label: string;
  description: string;
  component: string;
  previewImage: string | null;
}): ModelRecord {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    description: row.description,
    component: row.component,
    previewImage: row.previewImage ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch all models from the database, ordered by creation date. */
export async function getModels(): Promise<ModelRecord[]> {
  const rows = await prisma.model.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toModelRecord);
}

/** Fetch a single model by its slug name (e.g. "classic-floral"). Returns null if not found. */
export async function getModel(name: string): Promise<ModelRecord | null> {
  const row = await prisma.model.findUnique({ where: { name } });
  return row ? toModelRecord(row) : null;
}

/** Fetch a single model by its database id. Returns null if not found. */
export async function getModelById(id: string): Promise<ModelRecord | null> {
  const row = await prisma.model.findUnique({ where: { id } });
  return row ? toModelRecord(row) : null;
}
