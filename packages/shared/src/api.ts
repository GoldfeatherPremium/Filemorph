import { ApiError, isApiError } from "./errors";

export type ApiResult<T> = { data: T } | { error: { code: string; message: string; details?: unknown } };

export function ok<T>(data: T): ApiResult<T> {
  return { data };
}

export function failBody(e: unknown): { status: number; body: ApiResult<never> } {
  const err = isApiError(e) ? e : new ApiError(500, "internal_error", e instanceof Error ? e.message : "Internal error");
  return {
    status: err.status,
    body: { error: { code: err.code, message: err.message, details: err.details } },
  };
}

export function isApiResult<T>(r: unknown): r is ApiResult<T> {
  return typeof r === "object" && r !== null && ("data" in r || "error" in r);
}
