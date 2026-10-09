import type { ZodError } from "zod";

/**
 * Flatten a ZodError into a map of field name → first message, for inline form errors.
 * Nested paths are joined with "." and the first issue per field wins.
 */
export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
