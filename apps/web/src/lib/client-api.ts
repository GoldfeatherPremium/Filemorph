"use client";

export class ClientApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

interface ApiEnvelope<T> {
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if (!res.ok || !envelope || envelope.error) {
    const err = envelope?.error;
    throw new ClientApiError(res.status, err?.code ?? "request_failed", err?.message ?? `Request failed (${res.status})`, err?.details);
  }
  return envelope.data as T;
}

export function getGuestCookieName(): string {
  return "fm_guest";
}
