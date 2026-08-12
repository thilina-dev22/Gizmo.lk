import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const tmpDbPath = "/tmp/dev.db";

  // Copy SQLite db file to /tmp on Vercel serverless instances if available
  if (process.env.VERCEL) {
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, tmpDbPath);
      } catch (e) {
        console.error("Failed to copy dev.db to /tmp:", e);
      }
    }
    if (fs.existsSync(tmpDbPath)) {
      return `file:${tmpDbPath}`;
    }
  }

  return `file:${dbPath}`;
}

const dbUrl = getDbUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

