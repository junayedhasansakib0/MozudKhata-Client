import { afterEach, describe, expect, it, vi } from "vitest";
import { listProducts } from "./api";

/** Capture the URL each fetch is called with so we can assert query-string wiring. */
function stubFetchCapturingUrl() {
  const calls: string[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    calls.push(typeof input === "string" ? input : input.toString());
    return new Response(
      JSON.stringify({ data: { products: [] }, meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });
  vi.stubGlobal("fetch", impl);
  return { calls };
}

describe("listProducts query string (Phase 06)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serializes search, filter, and sort params", async () => {
    const { calls } = stubFetchCapturingUrl();
    await listProducts({
      page: 2,
      pageSize: 20,
      q: "cola",
      categoryId: "cat-1",
      stockStatus: "LOW",
      sort: "quantity",
      order: "desc",
    });
    const url = calls[0];
    expect(url).toContain("page=2");
    expect(url).toContain("q=cola");
    expect(url).toContain("categoryId=cat-1");
    expect(url).toContain("stockStatus=LOW");
    expect(url).toContain("sort=quantity");
    expect(url).toContain("order=desc");
  });

  it("omits empty/absent params", async () => {
    const { calls } = stubFetchCapturingUrl();
    await listProducts({ page: 1, pageSize: 20 });
    const url = calls[0];
    expect(url).not.toContain("q=");
    expect(url).not.toContain("categoryId=");
    expect(url).not.toContain("stockStatus=");
  });
});
