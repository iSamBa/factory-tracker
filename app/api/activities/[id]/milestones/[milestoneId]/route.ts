import { NextResponse } from "next/server";
import { MilestoneNotFoundError, deleteMilestone, updateMilestone } from "@/lib/activities";
import { updateMilestoneSchema } from "@/lib/validation/line";
import { handle, parseJson } from "@/lib/api";

type Params = { params: Promise<{ id: string; milestoneId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const { id, milestoneId } = await params;
    const input = await parseJson(request, updateMilestoneSchema);
    try {
      const milestone = await updateMilestone(id, milestoneId, input);
      return NextResponse.json({ milestone });
    } catch (err) {
      if (err instanceof MilestoneNotFoundError) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      throw err;
    }
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    const { id, milestoneId } = await params;
    try {
      await deleteMilestone(id, milestoneId);
      return NextResponse.json({ ok: true });
    } catch (err) {
      if (err instanceof MilestoneNotFoundError) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      throw err;
    }
  });
}
