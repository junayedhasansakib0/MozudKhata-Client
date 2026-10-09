import { describe, it, expect } from "vitest";

import { formatMoney, minorToMajor, formatNumber } from "@/lib/format";
import { getTextDirection } from "@/lib/i18n";

describe("money (minor units)", () => {
  it("converts USD minor units to major", () => {
    expect(minorToMajor(3432, "USD")).toBe(34.32);
  });

  it("handles zero-decimal currencies (JPY)", () => {
    expect(minorToMajor(1500, "JPY")).toBe(1500);
  });

  it("formats USD as a currency string", () => {
    expect(formatMoney({ amountMinor: 3432, currency: "USD" }, "en-US")).toBe("$34.32");
  });

  it("formats whole numbers with grouping", () => {
    expect(formatNumber(1482, "en-US")).toBe("1,482");
  });
});

describe("text direction", () => {
  it("is ltr for English", () => {
    expect(getTextDirection("en-US")).toBe("ltr");
  });

  it("is rtl for Arabic", () => {
    expect(getTextDirection("ar-EG")).toBe("rtl");
  });
});
