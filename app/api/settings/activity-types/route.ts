import { NextResponse } from "next/server";
import { createActivityType, listActivityTypes } from "@/lib/settings";
import { createActivityTypeSchema } from "@/lib/validation/settings";
import { handle, parseJson } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-errors";

export async function GET() {
  return handle(async () => {
    const types = await listActivityTypes();
    return NextResponse.json({ types });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const input = await parseJson(request, createActivityTypeSchema);
    try {
      const type = await createActivityType(input);
      return NextResponse.json({ type }, { status: 201 });
    } catch (err) {
      const res = toErrorResponse(err);
      if (res) return res;
      throw err;
    }
  });
}
