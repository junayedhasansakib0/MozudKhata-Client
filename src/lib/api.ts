import { env } from "./env";

/** Error codes mirrored from the backend error envelope (docs/api.md). */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** Thrown for any non-2xx response or transport failure. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode | "NETWORK",
    message: string,
    readonly status: number,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface SuccessEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorEnvelope {
  error: { code: ApiErrorCode; message: string; details?: ApiErrorDetail[] };
}

const BASE_URL = env.VITE_API_URL.replace(/\/$/, "");
const CSRF_HEADER = "X-CSRF-Token";

/** Core request: sends cookies, unwraps `{ data }`, throws `ApiError`. */
async function request<T>(path: string, options: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  } catch {
    throw new ApiError("NETWORK", "Unable to reach the server.", 0, undefined);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body: unknown = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const envelope = body as ErrorEnvelope | undefined;
    const error = envelope?.error;
    throw new ApiError(
      error?.code ?? "INTERNAL",
      error?.message ?? "Request failed.",
      response.status,
      error?.details,
    );
  }

  return (body as SuccessEnvelope<T>).data;
}

/**
 * Like `request` but returns the full success envelope (`data` + `meta`) for
 * read endpoints that paginate. Reads never need CSRF, so this stays GET-only.
 */
export async function apiGetWithMeta<T>(
  path: string,
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new ApiError("NETWORK", "Unable to reach the server.", 0, undefined);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body: unknown = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const error = (body as ErrorEnvelope | undefined)?.error;
    throw new ApiError(
      error?.code ?? "INTERNAL",
      error?.message ?? "Request failed.",
      response.status,
      error?.details,
    );
  }

  const envelope = body as SuccessEnvelope<T>;
  return { data: envelope.data, meta: envelope.meta };
}

// Double-submit CSRF (docs/security.md §4). The token is kept in memory (not
// read from the cookie, which is unreadable when the API is on another site)
// and echoed in a header; the browser sends the matching cookie automatically.
let csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  const { csrfToken: token } = await request<{ csrfToken: string }>("/auth/csrf", {});
  csrfToken = token;
  return token;
}

function isMutation(method: string): boolean {
  const m = method.toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

function withCsrf(options: RequestInit, token: string): RequestInit {
  return { ...options, headers: { ...options.headers, [CSRF_HEADER]: token } };
}

/**
 * Typed fetch wrapper for the MozudKhata API. Reads are sent as-is; state-
 * changing requests automatically carry the CSRF token (fetched on first use)
 * and retry once with a fresh token if the server reports it stale (403).
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? "GET";
  if (!isMutation(method)) {
    return request<T>(path, options);
  }

  const token = csrfToken ?? (await fetchCsrfToken());
  try {
    return await request<T>(path, withCsrf(options, token));
  } catch (error) {
    if (error instanceof ApiError && error.code === "FORBIDDEN") {
      const fresh = await fetchCsrfToken();
      return request<T>(path, withCsrf(options, fresh));
    }
    throw error;
  }
}
