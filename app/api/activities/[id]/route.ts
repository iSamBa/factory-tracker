import { NextResponse } from "next/server";
import {
  archiveActivity,
  completeActivity,
  getActivity,
  updateActivity
} from "@/lib/activities";
import { activityActionSchema, updateActivitySchema } from "@/lib/validation/activity";
import { handle, parseJson } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    const { id } = await params;
    const activity = await getActivity(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json({ activity });
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const { id } = await params;
    const existing = await getActivity(id);
    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // A body with an `action` field is a lifecycle action; otherwise it's a
    // metadata update.
    const raw: unknown = await request
      .clone()
      .json()
      .catch(() => ({}));
    const isAction = typeof raw === "object" && raw !== null && "action" in raw;

    if (isAction) {
      const { action } = await parseJson(request, activityActionSchema);
      if (action === "complete") {
        const completed = await completeActivity(id);
        if (!completed) {
          return NextResponse.json(
            { error: "All in-scope lines must be Finished or Not Applicable before completing" },
            { status: 409 }
          );
        }
        return NextResponse.json({ activity: completed });
      }
      const activity = await archiveActivity(id, action === "archive");
      return NextResponse.json({ activity });
    }

    const input = await parseJson(request, updateActivitySchema);
    const activity = await updateActivity(id, input);
    return NextResponse.json({ activity });
  });
}
