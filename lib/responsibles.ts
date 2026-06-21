// Helpers for the per-line `responsibles` field, stored as a JSON array of
// free-text names in a single SQLite column (no Person table; see story 005).

/** Parse the stored JSON column into a clean list of names. Tolerates bad data. */
export function parseResponsibles(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return normalizeResponsibles(parsed);
  } catch {
    return [];
  }
}

/** Trim, drop empties, and dedupe (case-insensitive, first spelling wins). */
export function normalizeResponsibles(names: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    if (typeof raw !== "string") continue;
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Serialize a clean list back into the JSON column form. */
export function serializeResponsibles(names: string[]): string {
  return JSON.stringify(normalizeResponsibles(names));
}
