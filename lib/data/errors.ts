/**
 * Typed client-side error model, mirroring the backend error envelope and codes in
 * docs/api.md. The HTTP adapter (Stage 3) maps backend responses into ApiError; the
 * mock adapter may throw ApiError to exercise error states during Stage 1.
 */

export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "SKU_DUPLICATE"
  | "INSUFFICIENT_STOCK"
  | "CREDIT_LIMIT_EXCEEDED"
  | "OVERRIDE_REQUIRED";

export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export interface ApiErrorOptions {
  status?: number;
  details?: ApiErrorDetail[];
  requestId?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: ApiErrorDetail[];
  readonly requestId?: string;

  constructor(code: ApiErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.code = code;
    this.status = options.status ?? 500;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Human-readable fallback message for a given error, safe to show in the UI. */
export function toUserMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
