import { apiGetWithMeta } from "@/lib/api";
import type { PageMeta } from "@/features/inventory/types";
import type { MovementListParams, MovementPage, MovementRecord } from "./types";

/** Global movement-history HTTP calls (docs/api.md §Phase 08). */

export function listOwnerMovements(params: MovementListParams): Promise<MovementPage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.productId) qs.set("productId", params.productId);
  if (params.type) qs.set("type", params.type);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  const query = qs.toString();
  return apiGetWithMeta<{ movements: MovementRecord[] }>(`/movements${query ? `?${query}` : ""}`).then(
    (res) => ({ movements: res.data.movements, meta: res.meta as unknown as PageMeta }),
  );
}
