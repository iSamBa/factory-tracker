import { listFactories } from "@/lib/factories";
import { getStatusDisplayMap, listActivityTypes, listRegions } from "@/lib/settings";
import { ACTIVITY_STATUSES, PROGRESS_BANDS } from "@/lib/activity-status";
import { generateMeta } from "@/lib/utils";
import { SettingsTabs } from "./settings-tabs";

export async function generateMetadata() {
  return generateMeta({
    title: "Settings",
    description: "Manage factories, regions, activity types, and status display.",
    canonical: "/dashboard/crm/settings"
  });
}

export default async function SettingsPage() {
  const [factories, regions, types, statusDisplay] = await Promise.all([
    listFactories(),
    listRegions(),
    listActivityTypes(),
    getStatusDisplayMap()
  ]);

  const factoryRows = factories.map((f) => ({
    id: f.id,
    name: f.name,
    region: f.region,
    country: f.country,
    lineCount: f._count.lines
  }));
  const regionRows = regions.map((r) => ({ id: r.id, name: r.name }));
  const typeRows = types.map((t) => ({ id: t.id, value: t.value, label: t.label }));
  const statusRows = ACTIVITY_STATUSES.map((s) => ({
    status: s,
    label: statusDisplay[s].label,
    badgeVariant: statusDisplay[s].badgeVariant,
    band: PROGRESS_BANDS[s]
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Define the factories and reference data the tracker uses.
        </p>
      </div>
      <SettingsTabs
        factories={factoryRows}
        regions={regionRows}
        types={typeRows}
        statuses={statusRows}
      />
    </div>
  );
}
