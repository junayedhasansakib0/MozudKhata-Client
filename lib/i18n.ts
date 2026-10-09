// Locale + text-direction helpers. Full i18n/message catalogs arrive later; this gives
// Stage 1 RTL readiness and a single source for the active locale.

export const DEFAULT_LOCALE = "en-US";

const RTL_LANGS = new Set(["ar", "he", "fa", "ur", "ps", "dv", "syr"]);

export type TextDirection = "ltr" | "rtl";

/** Resolve text direction from a BCP-47 locale (e.g. "ar-EG" → "rtl"). */
export function getTextDirection(locale: string): TextDirection {
  const lang = locale.split("-")[0]?.toLowerCase() ?? "";
  return RTL_LANGS.has(lang) ? "rtl" : "ltr";
}
