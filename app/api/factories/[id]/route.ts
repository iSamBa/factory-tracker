import { NextResponse } from "next/server";
import { deleteFactory, updateFactory } from "@/lib/factories";
import { updateFactorySchema } from "@/lib/validation/factory";
import { handle, parseJson } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const { id } = await params;
    const input = await parseJson(request, updateFactorySchema);
    try {
      const factory = await updateFactory(id, input);
      return NextResponse.json({ factory });
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
      await deleteFactory(id);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const res = toErrorResponse(err);
      if (res) return res;
      throw err;
    }
  });
}
