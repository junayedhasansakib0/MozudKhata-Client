import { DEFAULT_LOCALE } from "@/lib/i18n";
import type { Money } from "@/lib/data/types";

// Currency fraction digits are stable per currency; cache the lookup.
const fractionDigitsCache = new Map<string, number>();

function currencyFractionDigits(currency: string): number {
  const cached = fractionDigitsCache.get(currency);
  if (cached !== undefined) return cached;
  let digits = 2;
  try {
    digits =
      new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    digits = 2;
  }
  fractionDigitsCache.set(currency, digits);
  return digits;
}

/** Convert integer minor units to a major-unit number for the given currency. */
export function minorToMajor(amountMinor: number, currency: string): number {
  return amountMinor / 10 ** currencyFractionDigits(currency);
}

/** Format money (minor units) as a localized currency string. */
export function formatMoney(money: Money, locale: string = DEFAULT_LOCALE): string {
  const value = minorToMajor(money.amountMinor, money.currency);
  return new Intl.NumberFormat(locale, { style: "currency", currency: money.currency }).format(
    value,
  );
}

export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(d);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

/** Format a timestamp relative to now (e.g. "8 seconds ago", "in 3 days"). */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
): string {
  const d = date instanceof Date ? date : new Date(date);
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const absSec = Math.abs(diffSec);
  for (const [unit, secs] of RELATIVE_UNITS) {
    if (absSec >= secs || unit === "second") {
      return rtf.format(Math.round(diffSec / secs), unit);
    }
  }
  return rtf.format(0, "second");
}
