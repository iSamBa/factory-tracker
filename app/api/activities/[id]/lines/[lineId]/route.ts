import { NextResponse } from "next/server";
import { LineNotFoundError, getLineHistory, updateLine } from "@/lib/activities";
import { updateLineSchema } from "@/lib/validation/line";
import { handle, parseJson } from "@/lib/api";

type Params = { params: Promise<{ id: string; lineId: string }> };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    const { id, lineId } = await params;
    try {
      const history = await getLineHistory(id, lineId);
      return NextResponse.json({ history });
    } catch (err) {
      if (err instanceof LineNotFoundError) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      throw err;
    }
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const { id, lineId } = await params;
    const input = await parseJson(request, updateLineSchema);
    try {
      const line = await updateLine(id, lineId, input);
      return NextResponse.json({ line });
    } catch (err) {
      if (err instanceof LineNotFoundError) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      throw err;
    }
  });
}
