/**
 * Format a date value for display. Date-only strings (YYYY-MM-DD) are parsed at
 * local midnight so the calendar day is preserved regardless of timezone; full
 * ISO timestamps render normally. Falsy/invalid values render as an em dash.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = new Date(dateOnly ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
