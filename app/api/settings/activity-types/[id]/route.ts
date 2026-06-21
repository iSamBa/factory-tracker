import { NextResponse } from "next/server";
import { deleteActivityType, updateActivityType } from "@/lib/settings";
import { updateActivityTypeSchema } from "@/lib/validation/settings";
import { handle, parseJson } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const { id } = await params;
    const input = await parseJson(request, updateActivityTypeSchema);
    try {
      const type = await updateActivityType(id, input);
      return NextResponse.json({ type });
    } catch (err) {
      const res = toErrorResponse(err);
      if (res) return res;
      throw err;
    }
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    const { id } = await params;
    try {
      await deleteActivityType(id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const res = toErrorResponse(err);
      if (res) return res;
      throw err;
    }
  });
}
