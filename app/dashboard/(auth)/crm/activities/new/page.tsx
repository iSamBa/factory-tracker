import { db } from "@/lib/db";
import { generateMeta } from "@/lib/utils";
import { ActivityForm } from "./activity-form";

export async function generateMetadata() {
  return generateMeta({
    title: "New Activity",
    description: "Create a tracking activity and generate factory tracking lines from its scope.",
    canonical: "/dashboard/crm/activities/new"
  });
}

export default async function NewActivityPage() {
  const [factories, types, regions] = await Promise.all([
    db.factory.findMany({
      select: { id: true, name: true, region: true, country: true },
      orderBy: [{ region: "asc" }, { country: "asc" }, { name: "asc" }]
    }),
    db.activityTypeDef.findMany({
      select: { value: true, label: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }]
    }),
    db.region.findMany({
      select: { name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New activity</h1>
        <p className="text-muted-foreground text-sm">
          Define the activity and choose which factories are in scope.
        </p>
      </div>
      <ActivityForm factories={factories} types={types} regions={regions.map((r) => r.name)} />
    </div>
  );
}
