import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, describeApiError } from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps the success envelope's data field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ data: { ok: true } })),
    );
    await expect(apiFetch<{ ok: boolean }>("/health")).resolves.toEqual({ ok: true });
  });

  it("throws ApiError carrying the backend error code on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          { error: { code: "NOT_FOUND", message: "Resource not found." } },
          404,
        ),
      ),
    );
    await expect(apiFetch("/missing")).rejects.toMatchObject({
      name: "ApiError",
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("maps transport failures to a NETWORK ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("connection refused");
      }),
    );
    await expect(apiFetch("/health")).rejects.toBeInstanceOf(ApiError);
  });

  // Regression: a mutation must send `Content-Type: application/json` *and* the
  // CSRF header together. A header-merge bug once dropped Content-Type, so the
  // browser fell back to text/plain and the API rejected the body with a 400.
  it("sends Content-Type and the CSRF header together on mutations", async () => {
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.endsWith("/auth/csrf")) {
        return jsonResponse({ data: { csrfToken: "tok-123" } });
      }
      return jsonResponse({ data: { user: { id: "u1" } } }, 201);
    });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "supersecret" }),
    });

    const mutationCall = fetchMock.mock.calls.find(([url]) => url.endsWith("/auth/register"));
    expect(mutationCall).toBeDefined();
    const headers = mutationCall![1]!.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["X-CSRF-Token"]).toBe("tok-123");
  });

  // Regression: a bodyless mutation (archive/restore POSTs send no body) must NOT
  // declare `Content-Type: application/json` — Fastify's JSON parser rejects an
  // empty body with a 400 ("Invalid request.") when the header claims JSON. The
  // CSRF header must still be sent.
  it("omits Content-Type on a bodyless mutation but still sends CSRF", async () => {
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.endsWith("/auth/csrf")) {
        return jsonResponse({ data: { csrfToken: "tok-123" } });
      }
      return jsonResponse({ data: { product: { id: "p1" } } });
    });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/products/p1/archive", { method: "POST" });

    const mutationCall = fetchMock.mock.calls.find(([url]) => url.endsWith("/products/p1/archive"));
    expect(mutationCall).toBeDefined();
    const headers = mutationCall![1]!.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
    expect(headers["X-CSRF-Token"]).toBe("tok-123");
  });

  describe("describeApiError", () => {
    it("appends per-field validation details to the message", () => {
      const error = new ApiError("VALIDATION_ERROR", "Request validation failed.", 400, [
        { path: "email", message: "Invalid email" },
        { path: "password", message: "Password must be at least 8 characters." },
      ]);
      expect(describeApiError(error)).toBe(
        "Request validation failed. (email: Invalid email; password: Password must be at least 8 characters.)",
      );
    });

    it("falls back to the plain message when there are no field details", () => {
      const error = new ApiError("CONFLICT", "That email is already registered.", 409);
      expect(describeApiError(error)).toBe("That email is already registered.");
    });
  });
});
