import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Client } from "pg";

// ─── Constants ──────────────────────────────────────────────────────────────

/** The 11 application tables. Order is FK-safe enough for TRUNCATE ... CASCADE. */
export const APP_TABLES = [
  "InvitationEvent",
  "RsvpResponse",
  "Guest",
  "SaveTheDateEvent",
  "SaveTheDateRsvpResponse",
  "SaveTheDate",
  "SaveTheDateTheme",
  "Invitation",
  "Theme",
  "LandingFeature",
  "ContactSubmission",
] as const;

/** Baseline counts captured 2026-06-07. Logged for sanity; pass/fail is source==target. */
export const BASELINE_COUNTS: Record<string, number> = {
  InvitationEvent: 30350,
  RsvpResponse: 1548,
  SaveTheDateEvent: 687,
  Guest: 246,
  Invitation: 69,
  Theme: 15,
  LandingFeature: 13,
  SaveTheDate: 3,
  SaveTheDateRsvpResponse: 4,
  SaveTheDateTheme: 2,
  ContactSubmission: 0,
};

export const DUMP_FILE = "neon_data.sql";
export const PG18_BIN = "/opt/homebrew/opt/postgresql@18/bin";

// ─── Pure helpers ───────────────────────────────────────────────────────────

/** Remove Neon's "-pooler" suffix to get the direct endpoint pg_dump prefers. */
export function deriveDirectEndpoint(url: string): string {
  return url.replace("-pooler.", ".");
}

export interface CliOptions {
  reset: boolean;
}

export function parseArgs(argv: string[]): CliOptions {
  return { reset: argv.includes("--reset") };
}

export interface CountRow {
  table: string;
  source: number;
  target: number;
  ok: boolean;
}

export function diffCounts(
  source: Record<string, number>,
  target: Record<string, number>,
  tables: readonly string[],
): CountRow[] {
  return tables.map((table) => {
    const s = source[table] ?? -1;
    const t = target[table] ?? -1;
    return { table, source: s, target: t, ok: s === t };
  });
}

export function formatCountTable(rows: CountRow[]): string {
  const header = `${"table".padEnd(28)} ${"source".padStart(8)} ${"target".padStart(8)}  status`;
  const lines = rows.map(
    (r) =>
      `${r.table.padEnd(28)} ${String(r.source).padStart(8)} ${String(r.target).padStart(8)}  ${r.ok ? "OK" : "MISMATCH"}`,
  );
  return [header, ...lines].join("\n");
}

// ─── IO helpers ─────────────────────────────────────────────────────────────

/** Resolve a PG18 client tool by absolute path (keg-only), falling back to PATH. */
export function pgBin(tool: "pg_dump" | "psql"): string {
  const local = `${PG18_BIN}/${tool}`;
  return existsSync(local) ? local : tool;
}

/** Run a command, inheriting stdio. Rejects on non-zero exit. */
export function run(
  cmd: string,
  args: string[],
  opts: { env?: NodeJS.ProcessEnv } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      env: opts.env ?? process.env,
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`)),
    );
  });
}

/** Connect to a Postgres URL, run fn, always close. SSL is permissive for managed hosts. */
export async function withClient<T>(
  url: string,
  fn: (c: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Count rows for each table on the given database. */
export async function tableCounts(
  url: string,
  tables: readonly string[],
): Promise<Record<string, number>> {
  return withClient(url, async (c) => {
    const out: Record<string, number> = {};
    for (const t of tables) {
      const res = await c.query(`select count(*)::int as n from "${t}"`);
      out[t] = res.rows[0].n;
    }
    return out;
  });
}

/** Ensure the PG18 client binaries exist, installing via Homebrew if needed. */
export async function ensurePgTools(): Promise<void> {
  if (existsSync(`${PG18_BIN}/pg_dump`) && existsSync(`${PG18_BIN}/psql`)) {
    console.log("PostgreSQL 18 client tools present.");
    return;
  }
  console.log("Installing PostgreSQL 18 client (brew install postgresql@18)...");
  await run("brew", ["install", "postgresql@18"]);
  if (!existsSync(`${PG18_BIN}/pg_dump`) || !existsSync(`${PG18_BIN}/psql`)) {
    throw new Error(`pg_dump/psql not found at ${PG18_BIN} after install`);
  }
}

// ─── Phases ─────────────────────────────────────────────────────────────────

/** Choose the Neon endpoint for pg_dump: direct (non-pooled) preferred, pooled fallback. */
export async function pickDumpEndpoint(sourceUrl: string): Promise<string> {
  const direct = deriveDirectEndpoint(sourceUrl);
  try {
    await withClient(direct, async (c) => {
      await c.query("select 1");
    });
    console.log("Using Neon DIRECT endpoint for dump.");
    return direct;
  } catch (e) {
    console.warn(
      `Direct endpoint unreachable (${(e as Error).message}); using pooled endpoint.`,
    );
    await withClient(sourceUrl, async (c) => {
      await c.query("select 1");
    });
    return sourceUrl;
  }
}

/** TRUNCATE all app tables (RESTART IDENTITY CASCADE). No-op-safe on empty tables. */
export async function truncateAppTables(targetUrl: string): Promise<void> {
  await withClient(targetUrl, async (c) => {
    const list = APP_TABLES.map((t) => `"${t}"`).join(", ");
    await c.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  });
}

/**
 * Safety guard. If the target app tables don't exist yet -> clean (return).
 * If they exist but hold rows: abort, unless --reset, which truncates them first.
 *
 * Note: a freshly built schema is NOT necessarily empty — migration
 * 20260322000001_add_theme_table seeds 4 default Themes. Those seeded rows are
 * cleared by the unconditional truncate in main() right before the data load, so
 * this guard only fires on a target that already holds real migrated data.
 */
export async function guardTarget(
  targetUrl: string,
  opts: CliOptions,
): Promise<void> {
  let counts: Record<string, number>;
  try {
    counts = await tableCounts(targetUrl, APP_TABLES);
  } catch {
    console.log("Target schema not present yet — clean target.");
    return;
  }
  const nonEmpty = Object.entries(counts).filter(([, n]) => n > 0);
  if (nonEmpty.length === 0) {
    console.log("Target schema present and empty — OK.");
    return;
  }
  if (!opts.reset) {
    throw new Error(
      `Target already has data: ${nonEmpty
        .map(([t, n]) => `${t}=${n}`)
        .join(", ")}. Re-run with --reset to TRUNCATE the app tables first.`,
    );
  }
  console.log("--reset: truncating target app tables...");
  await truncateAppTables(targetUrl);
}

export const EXPECTED_MIGRATIONS = 47;

/**
 * Build the schema on the target via `prisma migrate deploy`.
 * DATABASE_URL is set explicitly to the target; prisma.config.ts's dotenv load
 * does NOT override an already-set env var, so the target wins. The post-condition
 * (migrations recorded on the TARGET) proves migrate deploy hit Railway, not Neon.
 */
export async function buildSchema(targetUrl: string): Promise<void> {
  console.log("Phase 1: prisma migrate deploy -> Railway");
  await run("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: targetUrl, NODE_ENV: "production" },
  });
  const migrations = await withClient(targetUrl, async (c) => {
    const res = await c.query(
      `select count(*)::int as n from "_prisma_migrations"`,
    );
    return res.rows[0].n as number;
  });
  if (migrations !== EXPECTED_MIGRATIONS) {
    throw new Error(
      `Expected ${EXPECTED_MIGRATIONS} migrations on target after deploy, found ${migrations}. ` +
        `Did migrate deploy target the wrong database?`,
    );
  }
  console.log(`Schema built: ${migrations} migrations recorded on Railway.`);
}

/** Dump data-only from Neon, excluding _prisma_migrations (already populated by Phase 1). */
export async function dumpData(dumpEndpoint: string): Promise<void> {
  console.log("Phase 2: pg_dump --data-only from Neon");
  await run(pgBin("pg_dump"), [
    dumpEndpoint,
    "--data-only",
    "--disable-triggers",
    "--no-owner",
    "--no-privileges",
    "--exclude-table-data=public._prisma_migrations",
    "-f",
    DUMP_FILE,
  ]);
  if (!existsSync(DUMP_FILE)) {
    throw new Error(`${DUMP_FILE} was not created`);
  }
  console.log(`Data dumped to ${DUMP_FILE}.`);
}

/** Load the dump into the target in a single transaction (all-or-nothing). */
export async function loadData(targetUrl: string): Promise<void> {
  console.log("Phase 3: psql load into Railway");
  await run(pgBin("psql"), [
    targetUrl,
    "--single-transaction",
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    DUMP_FILE,
  ]);
  console.log("Data loaded.");
}

/** Compare per-table counts source vs target, plus _prisma_migrations. Returns true if all match. */
export async function verify(
  sourceUrl: string,
  targetUrl: string,
): Promise<boolean> {
  console.log("Phase 4: verify row counts");
  const [src, tgt] = await Promise.all([
    tableCounts(sourceUrl, APP_TABLES),
    tableCounts(targetUrl, APP_TABLES),
  ]);
  const rows = diffCounts(src, tgt, APP_TABLES);
  console.log(formatCountTable(rows));
  const countsOk = rows.every((r) => r.ok);

  const migCount = (url: string) =>
    withClient(
      url,
      async (c) =>
        (await c.query(`select count(*)::int as n from "_prisma_migrations"`))
          .rows[0].n as number,
    );
  const [sm, tm] = await Promise.all([migCount(sourceUrl), migCount(targetUrl)]);
  const migOk = sm === tm;
  console.log(
    `_prisma_migrations: source=${sm} target=${tm} ${migOk ? "OK" : "MISMATCH"}`,
  );

  return countsOk && migOk;
}

// ─── Entry point ────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL;
  if (!sourceUrl || !targetUrl) {
    throw new Error(
      "SOURCE_DATABASE_URL and TARGET_DATABASE_URL must be set (see .env.migrate).",
    );
  }

  await ensurePgTools();
  console.log("Checking connectivity...");
  const dumpEndpoint = await pickDumpEndpoint(sourceUrl);
  await guardTarget(targetUrl, opts);

  await buildSchema(targetUrl);
  await dumpData(dumpEndpoint);
  // The freshly built schema is not necessarily empty (migrations seed default
  // Themes). Clear all app tables so the COPY load never hits a PK conflict.
  console.log("Clearing target app tables before load...");
  await truncateAppTables(targetUrl);
  await loadData(targetUrl);

  const ok = await verify(sourceUrl, targetUrl);
  if (!ok) {
    console.error("\n❌ Verification FAILED — counts do not match.");
    process.exit(1);
  }
  console.log("\n✅ Migration complete and verified.");
}

const isMain =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((err: unknown) => {
    console.error(
      "\n❌ Migration failed:",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  });
}
