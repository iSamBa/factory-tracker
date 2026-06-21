import { NextResponse } from "next/server";
import { createActivity, EmptyScopeError, listActivities } from "@/lib/activities";
import { createActivitySchema } from "@/lib/validation/activity";
import { handle, parseJson } from "@/lib/api";

export async function GET(request: Request) {
  return handle(async () => {
    const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
    const activities = await listActivities({ includeArchived });
    return NextResponse.json({ activities });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const input = await parseJson(request, createActivitySchema);
    try {
      const activity = await createActivity(input);
      return NextResponse.json({ activity }, { status: 201 });
    } catch (err) {
      if (err instanceof EmptyScopeError) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      throw err;
    }
  });
}
