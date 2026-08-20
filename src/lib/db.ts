import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  try {
    const client =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    return client;
  } catch (e) {
    console.error("PrismaClient initialization warning:", e);
    return null;
  }
}

export const db: PrismaClient | null = createPrismaClient();

if (process.env.NODE_ENV !== "production" && db) globalForPrisma.prisma = db;

let isTablesChecked = false;

export async function ensureTablesExist() {
  if (
    isTablesChecked ||
    !db ||
    !process.env.DATABASE_URL ||
    typeof db.$executeRawUnsafe !== "function"
  ) {
    return;
  }

  try {
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
    // Silently ignore if DB is unreachable
  }
}
