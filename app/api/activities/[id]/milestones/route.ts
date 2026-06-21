import { NextResponse } from "next/server";
import { createMilestone } from "@/lib/activities";
import { createMilestoneSchema } from "@/lib/validation/line";
import { handle, parseJson } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  return handle(async () => {
    const { id } = await params;
    const input = await parseJson(request, createMilestoneSchema);
    const milestone = await createMilestone(id, input);
    return NextResponse.json({ milestone }, { status: 201 });
  });
}
