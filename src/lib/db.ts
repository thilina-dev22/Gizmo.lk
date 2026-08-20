import type { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;
let isTablesChecked = false;

export async function getDb(): Promise<PrismaClient | null> {
  if (prismaInstance) return prismaInstance;
  if (!process.env.DATABASE_URL) return null;

  try {
    const { PrismaClient } = await import("@prisma/client");
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    return prismaInstance;
  } catch (e) {
    console.warn("PrismaClient initialization fallback:", e);
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
    // Silently fallback if database is not reachable
  }
}
