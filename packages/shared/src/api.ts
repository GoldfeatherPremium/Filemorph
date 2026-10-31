import { NextResponse } from "next/server";
import { ApiError, isApiError } from "./errors";

export type ApiResult<T> = { data: T } | { error: { code: string; message: string; details?: unknown } };

export function ok<T>(data: T): NextResponse<ApiResult<T>> {
  return NextResponse.json({ data } satisfies ApiResult<T>);
}

export function fail(e: unknown): NextResponse<ApiResult<never>> {
  const err = isApiError(e) ? e : new ApiError(500, "internal_error", e instanceof Error ? e.message : "Internal error");
  console.error("[api]", err.status, err.code, err.message);
  return NextResponse.json(
    { error: { code: err.code, message: err.message, details: err.details } } satisfies ApiResult<never>,
    { status: err.status },
  );
}

export function isApiResult<T>(r: unknown): r is ApiResult<T> {
  return typeof r === "object" && r !== null && ("data" in r || "error" in r);
}

export { ApiError };
