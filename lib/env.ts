import { z } from "zod";

/**
 * Public (client-exposed) environment. Only NEXT_PUBLIC_* keys — never secrets.
 * API base URL is optional during Stage 1 (mock data) and required from Stage 3
 * (frontend ↔ backend integration). Call getPublicEnv() where configuration is used.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid NEXT_PUBLIC_* environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }
  return parsed.data;
}
