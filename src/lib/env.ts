import { z } from "zod";

/**
 * Client-side environment contract. Only `VITE_`-prefixed vars are exposed to
 * the browser bundle by Vite — never put secrets here. Validated once at module
 * load so a misconfigured build fails fast rather than at a random fetch.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().min(1).default("/api/v1"),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("Invalid client environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid client environment configuration");
}

export const env = parsed.data;
