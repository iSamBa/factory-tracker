// Prisma client singleton. Reused across hot-reloads in dev to avoid exhausting
// connections. App code should import this via the `@/lib/db` alias; the internal
// imports stay relative so the seed script runs under tsx too.
//
// Prisma 7's `prisma-client` generator requires a driver adapter. We use
// better-sqlite3 against a local file resolved relative to the project root.
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";

// Mirror prisma.config.ts: fall back to an absolute path so the seed (run via
// tsx) and the app open the same prisma/dev.db regardless of the launch cwd.
const url = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
