import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { readDatabasePoolMax } from "./db-pool";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    max: readDatabasePoolMax(process.env.DATABASE_POOL_MAX),
    // Empty password for local trust auth; works with password-based auth too
    ...(process.env.DATABASE_URL?.includes("@localhost") &&
    !process.env.DATABASE_URL?.includes("password=")
      ? { password: "" }
      : {}),
  });
  const adapter = new PrismaPg(
    pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
  );
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
