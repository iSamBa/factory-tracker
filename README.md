# Factory Tracker

Track rollout/migration activities across factories. Next.js + Prisma (SQLite). Ships pre-seeded with regions, activity types, and the factory list.

## Run with Docker

```sh
docker compose up --build
```

Open http://localhost:3000

Data persists in the `app-data` volume. Reset to seed: `docker volume rm app-data`.

## Local development

```sh
pnpm install
pnpm db:push && pnpm db:seed   # create + seed prisma/dev.db
pnpm dev
```
