import { NextResponse } from "next/server";
import { FactoryNotFoundError } from "@/lib/factories";
import { InUseError, NotFoundError } from "@/lib/settings";

/**
 * Map a known domain/Prisma error to an HTTP response. Returns null for unknown
 * errors so the caller can rethrow and let `handle()` produce a 500.
 */
export function toErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof FactoryNotFoundError || err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof InUseError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002") {
    return NextResponse.json({ error: "That value already exists" }, { status: 409 });
  }
  return null;
}
