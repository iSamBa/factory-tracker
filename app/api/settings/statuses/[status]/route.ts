import { NextResponse } from "next/server";
import { setStatusOverride } from "@/lib/settings";
import { updateStatusOverrideSchema } from "@/lib/validation/settings";
import { handle, parseJson } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-errors";

type Params = { params: Promise<{ status: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const { status } = await params;
    const input = await parseJson(request, updateStatusOverrideSchema);
    try {
      const override = await setStatusOverride(status, input);
      return NextResponse.json({ override });
    } catch (err) {
      const res = toErrorResponse(err);
      if (res) return res;
      throw err;
    }
  });
}
