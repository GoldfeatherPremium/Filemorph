export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, "not_found", message);
  }
}

export class BadRequestError extends ApiError {
  constructor(code = "bad_request", message = "Bad request", details?: unknown) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, "unauthorized", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, "forbidden", message);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Too many requests") {
    super(429, "rate_limited", message);
  }
}

export class PaymentRequiredError extends ApiError {
  constructor(code = "plan_limit", message = "Upgrade required") {
    super(402, code, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(409, "conflict", message);
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message = "Service temporarily unavailable") {
    super(503, "service_unavailable", message);
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError(500, "internal_error", e instanceof Error ? e.message : "Internal error");
}
