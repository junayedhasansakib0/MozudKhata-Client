import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
}

function record(): { calls: Call[]; fetchImpl: typeof fetch } {
  const calls: Call[] = [];
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const headers = Object.fromEntries(
      new Headers(init?.headers as HeadersInit).entries(),
    ) as Record<string, string>;
    calls.push({ url, method: (init?.method ?? "GET").toUpperCase(), headers });

    if (url.includes("/auth/csrf")) {
      return new Response(JSON.stringify({ data: { csrfToken: `token-${calls.length}` } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ data: { user: { id: "u1" } } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

describe("apiFetch CSRF handling", () => {
  beforeEach(() => {
    // Fresh module each test so the in-memory CSRF token cache resets.
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches a CSRF token then attaches it to a mutation", async () => {
    const { calls, fetchImpl } = record();
    vi.stubGlobal("fetch", fetchImpl);
    const { apiFetch } = await import("./api");

    await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({}) });

    expect(calls[0]?.url).toContain("/auth/csrf");
    expect(calls[0]?.method).toBe("GET");
    const mutation = calls[1];
    expect(mutation?.url).toContain("/auth/login");
    expect(mutation?.headers["x-csrf-token"]).toBe("token-1");
  });

  it("does not request a CSRF token for read requests", async () => {
    const { calls, fetchImpl } = record();
    vi.stubGlobal("fetch", fetchImpl);
    const { apiFetch } = await import("./api");

    await apiFetch("/auth/me");

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toContain("/auth/me");
  });

  it("retries once with a fresh token when the server rejects CSRF (403)", async () => {
    const calls: Call[] = [];
    let loginAttempts = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const headers = Object.fromEntries(
        new Headers(init?.headers as HeadersInit).entries(),
      ) as Record<string, string>;
      calls.push({ url, method: (init?.method ?? "GET").toUpperCase(), headers });

      if (url.includes("/auth/csrf")) {
        return new Response(JSON.stringify({ data: { csrfToken: `token-${calls.length}` } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      loginAttempts += 1;
      if (loginAttempts === 1) {
        return new Response(
          JSON.stringify({ error: { code: "FORBIDDEN", message: "Invalid CSRF." } }),
          { status: 403, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ data: { success: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    vi.stubGlobal("fetch", fetchImpl);
    const { apiFetch } = await import("./api");

    await expect(
      apiFetch("/auth/logout", { method: "POST" }),
    ).resolves.toEqual({ success: true });
    expect(loginAttempts).toBe(2);
  });
});
