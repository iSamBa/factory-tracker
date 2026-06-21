// Seed ~22 placeholder factories + 2 sample activities with generated tracking
// lines, so the UI stories (003+) have realistic data to render.
// NOTE: the factory list is a placeholder per the feature's open question — the
// authoritative ~22-factory list will replace this when provided.
import { db } from "../lib/db";
import {
  ACTIVITY_TYPES,
  ActivityStatus,
  REGIONS,
  computeOverallProgress,
  type ActivityStatus as Status
} from "../lib/activity-status";

// Display labels for the seeded activity types (kept in sync with ACTIVITY_TYPES).
const TYPE_LABELS: Record<string, string> = {
  migration: "Migration",
  onboarding: "Onboarding",
  rollout: "Rollout",
  compliance: "Compliance",
  maintenance: "Maintenance",
  "service-enablement": "Service Enablement"
};

const FACTORIES: { name: string; region: string; country: string }[] = [
  // EU
  { name: "Nuremberg", region: "EU", country: "Germany" },
  { name: "Lyon", region: "EU", country: "France" },
  { name: "Milan", region: "EU", country: "Italy" },
  { name: "Barcelona", region: "EU", country: "Spain" },
  { name: "Wroclaw", region: "EU", country: "Poland" },
  { name: "Brno", region: "EU", country: "Czechia" },
  { name: "Eindhoven", region: "EU", country: "Netherlands" },
  { name: "Gothenburg", region: "EU", country: "Sweden" },
  { name: "Manchester", region: "EU", country: "United Kingdom" },
  // CN
  { name: "Suzhou", region: "CN", country: "China" },
  { name: "Shenzhen", region: "CN", country: "China" },
  { name: "Chengdu", region: "CN", country: "China" },
  { name: "Tianjin", region: "CN", country: "China" },
  { name: "Wuhan", region: "CN", country: "China" },
  // US
  { name: "Detroit", region: "US", country: "United States" },
  { name: "Austin", region: "US", country: "United States" },
  { name: "Charlotte", region: "US", country: "United States" },
  { name: "Phoenix", region: "US", country: "United States" },
  { name: "Columbus", region: "US", country: "United States" },
  // Other
  { name: "Monterrey", region: "Other", country: "Mexico" },
  { name: "Campinas", region: "Other", country: "Brazil" },
  { name: "Pune", region: "Other", country: "India" }
];

// A small rotation of valid (status, progress) pairs used to give seeded lines
// variety while respecting the §6 progress bands.
const LINE_PROFILES: { status: Status; progress: number }[] = [
  { status: ActivityStatus.Finished, progress: 100 },
  { status: ActivityStatus.InProgress, progress: 65 },
  { status: ActivityStatus.Planned, progress: 30 },
  { status: ActivityStatus.Assessment, progress: 15 },
  { status: ActivityStatus.Blocked, progress: 45 },
  { status: ActivityStatus.NotStarted, progress: 0 },
  { status: ActivityStatus.NotApplicable, progress: 0 }
];

async function clear() {
  // Delete in FK-dependency order.
  await db.updateHistory.deleteMany();
  await db.blocker.deleteMany();
  await db.milestone.deleteMany();
  await db.activityFactoryStatus.deleteMany();
  await db.activity.deleteMany();
  await db.factory.deleteMany();
  await db.region.deleteMany();
  await db.activityTypeDef.deleteMany();
  await db.statusOverride.deleteMany();
}

async function main() {
  await clear();

  // Reference data managed via Settings (seeded from the code defaults).
  for (let i = 0; i < REGIONS.length; i++) {
    await db.region.create({ data: { name: REGIONS[i], sortOrder: i } });
  }
  for (let i = 0; i < ACTIVITY_TYPES.length; i++) {
    const value = ACTIVITY_TYPES[i];
    await db.activityTypeDef.create({
      data: { value, label: TYPE_LABELS[value] ?? value, sortOrder: i }
    });
  }
  console.log(`Seeded ${REGIONS.length} regions, ${ACTIVITY_TYPES.length} activity types.`);

  const factories = [];
  for (const f of FACTORIES) {
    factories.push(await db.factory.create({ data: f }));
  }
  console.log(`Seeded ${factories.length} factories.`);

  // Sample activities are demo-only data. The Docker build seeds the shipped
  // template DB with SEED_SAMPLES=false so the image carries settings +
  // factories only (no ACT-001/ACT-002). Local `pnpm db:seed` keeps the demo.
  if (process.env.SEED_SAMPLES === "false") {
    console.log("SEED_SAMPLES=false — skipping sample activities.");
    return;
  }

  // --- Activity 1: scope = all factories ---
  const a1 = await db.activity.create({
    data: {
      activityId: "ACT-001",
      name: "Endpoint Security Rollout",
      type: "rollout",
      description: "Deploy the new endpoint security agent across all factories.",
      scopeRule: "all",
      globalOwner: "Dana Whitfield",
      startDate: new Date("2026-04-01"),
      targetEndDate: new Date("2026-09-30"),
      milestones: {
        create: [
          { name: "Pilot complete", date: new Date("2026-05-15"), status: "Done" },
          { name: "Global rollout", date: new Date("2026-08-31"), status: "InProgress" }
        ]
      }
    }
  });

  const a1Lines: { status: string; progress: number }[] = [];
  for (let i = 0; i < factories.length; i++) {
    const profile = LINE_PROFILES[i % LINE_PROFILES.length];
    const line = await db.activityFactoryStatus.create({
      data: {
        activityId: a1.id,
        factoryId: factories[i].id,
        inScope: "Yes",
        responsibles: JSON.stringify([`Owner ${factories[i].name}`, "Coordinator"]),
        status: profile.status,
        progress: profile.progress,
        currentPhase: profile.status,
        blockerFlag: profile.status === ActivityStatus.Blocked,
        nextAction: profile.status === ActivityStatus.Blocked ? "Escalate to platform team" : null
      }
    });
    a1Lines.push({ status: line.status, progress: line.progress });

    if (profile.status === ActivityStatus.Blocked) {
      await db.blocker.create({
        data: {
          lineId: line.id,
          description: `Network segmentation blocking agent install at ${factories[i].name}`,
          ownerOfBlocker: "Network Ops",
          expectedResolutionDate: new Date("2026-07-15"),
          nextAction: "Open firewall change request",
          resolved: false
        }
      });
    }
  }
  await db.activity.update({
    where: { id: a1.id },
    data: { overallProgress: computeOverallProgress(a1Lines) }
  });

  // --- Activity 2: scope = EU region only ---
  const euFactories = factories.filter((f) => f.region === "EU");
  const a2 = await db.activity.create({
    data: {
      activityId: "ACT-002",
      name: "GDPR Data Retention Compliance",
      type: "compliance",
      description: "Apply updated data-retention policies across EU factories.",
      scopeRule: "regions",
      globalOwner: "Priya Anand",
      startDate: new Date("2026-05-01"),
      targetEndDate: new Date("2026-10-31"),
      milestones: {
        create: [{ name: "Policy sign-off", date: new Date("2026-06-30"), status: "InProgress" }]
      }
    }
  });

  // Non-NotApplicable profiles (drop the trailing NA entry) so the only NA lines
  // for activity 2 are the two explicitly forced below.
  const NON_NA_PROFILES = LINE_PROFILES.filter((p) => p.status !== ActivityStatus.NotApplicable);
  const a2Lines: { status: string; progress: number }[] = [];
  for (let i = 0; i < euFactories.length; i++) {
    // Force exactly the first two EU lines NotApplicable to exercise overall-progress exclusion.
    const profile =
      i < 2 ? { status: ActivityStatus.NotApplicable, progress: 0 } : NON_NA_PROFILES[i % NON_NA_PROFILES.length];
    const line = await db.activityFactoryStatus.create({
      data: {
        activityId: a2.id,
        factoryId: euFactories[i].id,
        inScope: profile.status === ActivityStatus.NotApplicable ? "No" : "Yes",
        responsibles: JSON.stringify([`Compliance ${euFactories[i].name}`]),
        status: profile.status,
        progress: profile.progress,
        currentPhase: profile.status,
        blockerFlag: false,
        nextAction: profile.status === ActivityStatus.NotApplicable ? "Out of scope for this site" : "Confirm retention config"
      }
    });
    a2Lines.push({ status: line.status, progress: line.progress });
  }
  await db.activity.update({
    where: { id: a2.id },
    data: { overallProgress: computeOverallProgress(a2Lines) }
  });

  console.log(
    `Seeded activities: ${a1.activityId} (${a1Lines.length} lines, overall ${computeOverallProgress(a1Lines)}%), ` +
      `${a2.activityId} (${a2Lines.length} lines, overall ${computeOverallProgress(a2Lines)}%).`
  );
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
