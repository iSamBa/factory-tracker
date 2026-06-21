import { NextResponse } from "next/server";
import { deleteRegion, updateRegion } from "@/lib/settings";
import { updateRegionSchema } from "@/lib/validation/settings";
import { handle, parseJson } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const { id } = await params;
    const input = await parseJson(request, updateRegionSchema);
    try {
      const region = await updateRegion(id, input);
      return NextResponse.json({ region });
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
      await deleteRegion(id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const res = toErrorResponse(err);
      if (res) return res;
      throw err;
    }
  });
}
