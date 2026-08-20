import type { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;
let isTablesChecked = false;
let isDbDisabled = false;
let lastDbErrorTime = 0;

export function reportDbError(error: any) {
  isDbDisabled = true;
  lastDbErrorTime = Date.now();
  console.warn(
    "⚠️ Database unavailable/circuit breaker active, using in-memory catalog fallback:",
    error?.message || error
  );
}

export async function getDb(): Promise<PrismaClient | null> {
  if (!process.env.DATABASE_URL) return null;

  // If a fatal DB connection failure occurred in the last 60 seconds, gracefully bypass
  if (isDbDisabled && Date.now() - lastDbErrorTime < 60000) {
    return null;
  }

  try {
    if (prismaInstance) return prismaInstance;
    const { PrismaClient } = await import("@prisma/client");
    prismaInstance = new PrismaClient({
      log: ["error"],
    });
    return prismaInstance;
  } catch (e) {
    reportDbError(e);
    return null;
  }
}

export async function ensureTablesExist() {
  if (isTablesChecked || !process.env.DATABASE_URL) return;

  try {
    const db = await getDb();
    if (!db || typeof db.$executeRawUnsafe !== "function") return;

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Review" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        "authorName" TEXT NOT NULL,
        "rating" INTEGER NOT NULL DEFAULT 5,
        "comment" TEXT NOT NULL,
        "isApproved" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.$executeRawUnsafe(`
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);

    await db.$executeRawUnsafe(`
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;
    `);

    isTablesChecked = true;
  } catch (err) {
    reportDbError(err);
  }
}
