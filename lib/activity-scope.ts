// Pure scope/lifecycle logic for activities — no DB imports, so it stays unit
// testable in isolation. The DB-backed operations live in `lib/activities.ts`.
import { ActivityStatus } from "./activity-status";
import type { ScopeInput } from "./validation/activity";

/** Minimal factory shape needed to resolve a scope to factory ids. */
export interface ScopableFactory {
  id: string;
  region: string;
  country: string;
}

/** Minimal line shape needed for the completion guard. */
export interface CompletableLine {
  status: string;
}

/**
 * Given a scope rule and the full factory list, return the de-duplicated set of
 * in-scope factory ids. Unknown ids in the "factories" rule are dropped (only
 * real factories can be tracked).
 */
export function resolveFactoryIdsForScope(
  scope: ScopeInput,
  factories: ScopableFactory[]
): string[] {
  let matched: ScopableFactory[];
  switch (scope.rule) {
    case "all":
      matched = factories;
      break;
    case "regions": {
      const regions = new Set<string>(scope.regions ?? []);
      matched = factories.filter((f) => regions.has(f.region));
      break;
    }
    case "countries": {
      const countries = new Set(scope.countries ?? []);
      matched = factories.filter((f) => countries.has(f.country));
      break;
    }
    case "factories": {
      const wanted = new Set(scope.factoryIds ?? []);
      matched = factories.filter((f) => wanted.has(f.id));
      break;
    }
    default:
      matched = [];
  }
  return Array.from(new Set(matched.map((f) => f.id)));
}

/**
 * Completion guard (§8.4): an activity may be completed only when it has at least
 * one line and every line is Finished or NotApplicable.
 */
export function canCompleteActivity(lines: CompletableLine[]): boolean {
  if (lines.length === 0) return false;
  return lines.every(
    (line) => line.status === ActivityStatus.Finished || line.status === ActivityStatus.NotApplicable
  );
}
