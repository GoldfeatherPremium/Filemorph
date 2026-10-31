import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { BadRequestError, failBody, type ApiResult } from "@filemorph/shared";

export type RouteContext = { params: Promise<Record<string, string>> };

type Handler<C = unknown> = (req: NextRequest, ctx: C) => Promise<unknown>;

/**
 * Wrap a route handler so it can return plain data (wrapped as { data }) or a
 * Response, and map thrown ApiError/errors to consistent JSON error bodies.
 */
export function apiRoute<C = RouteContext>(handler: Handler<C>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      const out = await handler(req, ctx);
      if (out instanceof Response) return out;
      const body: ApiResult<unknown> = { data: out };
      return NextResponse.json(body);
    } catch (e) {
      const { status, body } = failBody(e);
      return NextResponse.json(body, { status });
    }
  };
}

/** Parse a JSON request body against a Zod schema (throws BadRequestError). */
export async function parseBody<T>(req: Request, schema: z.ZodType<T, any, any>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new BadRequestError("invalid_json", "Request body must be valid JSON.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new BadRequestError("validation_failed", "Invalid request body.", parsed.error.issues);
  }
  return parsed.data;
}

/** Parse a URL `?q=` string param. */
export function queryParam(url: URL, name: string): string | undefined {
  const v = url.searchParams.get(name);
  return v && v.trim().length ? v.trim() : undefined;
}

/** Attach a cookie to a response (used for guest tokens). */
export function setCookie(res: NextResponse, name: string, value: string, options: Record<string, unknown>): void {
  res.cookies.set(name, value, options as never);
}
