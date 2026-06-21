import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 needs `datasource.url` for the schema engine (db push / migrate). The
// CLI resolves relative `file:` URLs against the schema dir while the runtime
// driver adapter in `lib/db.ts` resolves against cwd, so we use one absolute
// path here to keep both pointed at the same prisma/dev.db file. The seed script
// runs via `tsx` and uses the adapter from `lib/db.ts` directly.
const dbUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: dbUrl,
  },
});
