import { describe, it, expect } from "vitest";

import type { ReportDataset } from "@/lib/data/types";
import { reportToCsv } from "./report-csv";

const dataset: ReportDataset = {
  key: "sales",
  title: "Sales",
  description: "",
  kpis: [],
  chartLabel: "",
  chart: [],
  columns: ["Order", "Total"],
  rows: [
    ["#9001", "$43.20"],
    ['With, comma', '"quoted"'],
  ],
};

describe("report-csv", () => {
  it("serializes columns + rows and escapes commas/quotes", () => {
    const csv = reportToCsv(dataset);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Order,Total");
    expect(lines[1]).toBe("#9001,$43.20");
    expect(lines[2]).toBe('"With, comma","""quoted"""');
  });
});
