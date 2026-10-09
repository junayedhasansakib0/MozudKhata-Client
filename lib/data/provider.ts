import type { DataSource } from "./repositories";
import { createMockDataSource } from "./mock/mock-adapter";

/**
 * Single swap point for the data-access layer.
 *
 * Stage 1 returns the mock adapter. Stage 3 (frontend ↔ backend integration) replaces
 * the implementation here with an HTTP adapter that implements the same DataSource
 * contract — no UI or hook changes required. For example:
 *
 *   instance = getPublicEnv().NEXT_PUBLIC_API_BASE_URL
 *     ? createHttpDataSource(baseUrl)
 *     : createMockDataSource();
 */
let instance: DataSource | null = null;

export function getDataSource(): DataSource {
  if (!instance) {
    instance = createMockDataSource();
  }
  return instance;
}
