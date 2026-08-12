import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

let isTablesChecked = false;

export async function ensureTablesExist() {
  if (isTablesChecked) return;
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
    console.error("Auto-schema check warning:", err);
  }
}


