import { NextResponse } from "next/server";
import { createRegion, listRegions } from "@/lib/settings";
import { createRegionSchema } from "@/lib/validation/settings";
import { handle, parseJson } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-errors";

export async function GET() {
  return handle(async () => {
    const regions = await listRegions();
    return NextResponse.json({ regions });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const input = await parseJson(request, createRegionSchema);
    try {
      const region = await createRegion(input);
      return NextResponse.json({ region }, { status: 201 });
    } catch (err) {
      const res = toErrorResponse(err);
      if (res) return res;
      throw err;
    }
  });
}
