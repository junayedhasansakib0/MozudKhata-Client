import type { ReportDataset } from "@/lib/data/types";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialize a report dataset's table to CSV text. */
export function reportToCsv(dataset: ReportDataset): string {
  const lines = [dataset.columns.map(csvCell).join(",")];
  for (const row of dataset.rows) lines.push(row.map(csvCell).join(","));
  return lines.join("\n");
}
