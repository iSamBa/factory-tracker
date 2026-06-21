import { NextResponse } from "next/server";
import { createFactory, listFactories } from "@/lib/factories";
import { createFactorySchema } from "@/lib/validation/factory";
import { handle, parseJson } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-errors";

export async function GET() {
  return handle(async () => {
    const factories = await listFactories();
    return NextResponse.json({ factories });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const input = await parseJson(request, createFactorySchema);
    try {
      const factory = await createFactory(input);
      return NextResponse.json({ factory }, { status: 201 });
    } catch (err) {
      const res = toErrorResponse(err);
      if (res) return res;
      throw err;
    }
  });
}
