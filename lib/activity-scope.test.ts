import { describe, it, expect } from "vitest";
import { canCompleteActivity, resolveFactoryIdsForScope } from "./activity-scope";
import type { ScopableFactory } from "./activity-scope";
import { ActivityStatus } from "./activity-status";
import type { ScopeInput } from "./validation/activity";

const FACTORIES: ScopableFactory[] = [
  { id: "f1", region: "EU", country: "Germany" },
  { id: "f2", region: "EU", country: "France" },
  { id: "f3", region: "CN", country: "China" },
  { id: "f4", region: "US", country: "United States" },
  { id: "f5", region: "US", country: "United States" }
];

describe("resolveFactoryIdsForScope", () => {
  it("scope=all returns every factory id", () => {
    const scope: ScopeInput = { rule: "all" };
    expect(resolveFactoryIdsForScope(scope, FACTORIES)).toEqual(["f1", "f2", "f3", "f4", "f5"]);
  });

  it("scope=regions returns only matching regions", () => {
    const scope: ScopeInput = { rule: "regions", regions: ["EU"] };
    expect(resolveFactoryIdsForScope(scope, FACTORIES)).toEqual(["f1", "f2"]);
  });

  it("scope=regions with multiple regions", () => {
    const scope: ScopeInput = { rule: "regions", regions: ["CN", "US"] };
    expect(resolveFactoryIdsForScope(scope, FACTORIES)).toEqual(["f3", "f4", "f5"]);
  });

  it("scope=countries filters by country", () => {
    const scope: ScopeInput = { rule: "countries", countries: ["United States"] };
    expect(resolveFactoryIdsForScope(scope, FACTORIES)).toEqual(["f4", "f5"]);
  });

  it("scope=factories returns explicit ids and ignores unknown ones", () => {
    const scope: ScopeInput = { rule: "factories", factoryIds: ["f2", "f4", "ghost"] };
    expect(resolveFactoryIdsForScope(scope, FACTORIES)).toEqual(["f2", "f4"]);
  });

  it("scope=factories de-duplicates repeated ids", () => {
    const scope: ScopeInput = { rule: "factories", factoryIds: ["f1", "f1", "f2"] };
    expect(resolveFactoryIdsForScope(scope, FACTORIES)).toEqual(["f1", "f2"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(resolveFactoryIdsForScope({ rule: "regions", regions: ["EU"] }, [])).toEqual([]);
    expect(
      resolveFactoryIdsForScope({ rule: "countries", countries: ["Atlantis"] }, FACTORIES)
    ).toEqual([]);
  });
});

describe("canCompleteActivity", () => {
  it("is false for an empty line set", () => {
    expect(canCompleteActivity([])).toBe(false);
  });

  it("is true when every line is Finished or NotApplicable", () => {
    expect(
      canCompleteActivity([
        { status: ActivityStatus.Finished },
        { status: ActivityStatus.NotApplicable },
        { status: ActivityStatus.Finished }
      ])
    ).toBe(true);
  });

  it("is true when all lines are NotApplicable", () => {
    expect(
      canCompleteActivity([
        { status: ActivityStatus.NotApplicable },
        { status: ActivityStatus.NotApplicable }
      ])
    ).toBe(true);
  });

  it("is false when any line is not yet terminal", () => {
    expect(
      canCompleteActivity([
        { status: ActivityStatus.Finished },
        { status: ActivityStatus.InProgress }
      ])
    ).toBe(false);
    expect(canCompleteActivity([{ status: ActivityStatus.Blocked }])).toBe(false);
  });
});
