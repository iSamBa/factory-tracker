import { db } from "@/lib/db";
import type { CreateFactoryInput, UpdateFactoryInput } from "@/lib/validation/factory";

export class FactoryNotFoundError extends Error {
  constructor() {
    super("Factory not found");
    this.name = "FactoryNotFoundError";
  }
}

/** All factories with a count of tracking lines (so the UI can warn on delete). */
export function listFactories() {
  return db.factory.findMany({
    orderBy: [{ region: "asc" }, { country: "asc" }, { name: "asc" }],
    include: { _count: { select: { lines: true } } }
  });
}

export function createFactory(input: CreateFactoryInput) {
  return db.factory.create({ data: input });
}

export async function updateFactory(id: string, input: UpdateFactoryInput) {
  const existing = await db.factory.findUnique({ where: { id } });
  if (!existing) throw new FactoryNotFoundError();
  return db.factory.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.country !== undefined ? { country: input.country } : {})
    }
  });
}

/** Deletes a factory. Its tracking lines cascade-delete (schema onDelete: Cascade). */
export async function deleteFactory(id: string) {
  const existing = await db.factory.findUnique({ where: { id } });
  if (!existing) throw new FactoryNotFoundError();
  return db.factory.delete({ where: { id } });
}
