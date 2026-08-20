import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export async function getDb(): Promise<PrismaClient> {
  return prisma;
}

export async function ensureTablesExist() {
  // Database tables are managed and synced via Prisma Schema
}

export function reportDbError(error: any) {
  console.error("Prisma Database Error:", error?.message || error);
}

