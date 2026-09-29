import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api";

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
});
