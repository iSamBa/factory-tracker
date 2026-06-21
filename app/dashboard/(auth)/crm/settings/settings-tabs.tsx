"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FactoriesPanel, type FactoryRow } from "./factories-panel";
import { RegionsPanel, type RegionRow } from "./regions-panel";
import { ActivityTypesPanel, type TypeRow } from "./activity-types-panel";
import { StatusesPanel, type StatusRow } from "./statuses-panel";

export function SettingsTabs({
  factories,
  regions,
  types,
  statuses
}: {
  factories: FactoryRow[];
  regions: RegionRow[];
  types: TypeRow[];
  statuses: StatusRow[];
}) {
  const regionNames = regions.map((r) => r.name);

  return (
    <Tabs defaultValue="factories" className="space-y-4">
      <TabsList>
        <TabsTrigger value="factories">Factories</TabsTrigger>
        <TabsTrigger value="regions">Regions</TabsTrigger>
        <TabsTrigger value="types">Activity types</TabsTrigger>
        <TabsTrigger value="statuses">Statuses</TabsTrigger>
      </TabsList>

      <TabsContent value="factories">
        <Card>
          <CardContent className="pt-6">
            <FactoriesPanel factories={factories} regionNames={regionNames} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="regions">
        <Card>
          <CardContent className="pt-6">
            <RegionsPanel regions={regions} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="types">
        <Card>
          <CardContent className="pt-6">
            <ActivityTypesPanel types={types} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="statuses">
        <Card>
          <CardContent className="pt-6">
            <StatusesPanel statuses={statuses} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
