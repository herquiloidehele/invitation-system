import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    // Empty password for local trust auth; works with password-based auth too
    ...(process.env.DATABASE_URL?.includes("@localhost") &&
    !process.env.DATABASE_URL?.includes("password=")
      ? { password: "" }
      : {}),
  });
  // `@prisma/adapter-pg` bundles its own `@types/pg` version which is
  // structurally distinct from the top-level `@types/pg` even though
  // both describe the same runtime `pg.Pool`. The cast via `unknown` is
  // required by TS to bridge the two type universes; runtime is fine.
  const adapter = new PrismaPg(
    pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
  );
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
