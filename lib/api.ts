import { NextResponse } from "next/server";
import { z } from "zod";

/** Parse JSON body against a zod schema; throws a Response on failure. */
export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw NextResponse.json(
      { error: "Validation failed", issues: z.flattenError(result.error) },
      { status: 400 }
    );
  }
  return result.data;
}

/** Wrap a handler so thrown Responses become the response and unexpected errors become 500. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
