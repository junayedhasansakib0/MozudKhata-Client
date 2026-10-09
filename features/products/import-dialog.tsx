"use client";

import * as React from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CSV_COLUMNS, parseCatalogCsv, validateImportRows } from "./catalog-math";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knownSkus: Set<string>;
}

const SAMPLE = `name,sku,barcode,category,brand,cost,sell,unit,status
Example Beans 250g,EX-001,890000001,Whole Bean Coffee,Mozud Roastery,8.00,16.00,bag,active`;

export function ImportDialog({ open, onOpenChange, knownSkus }: ImportDialogProps) {
  // Mounted fresh each time it opens (parent renders it conditionally).
  const [text, setText] = React.useState("");

  const preview = React.useMemo(() => {
    const rows = parseCatalogCsv(text);
    return rows.length > 0 ? validateImportRows(rows, knownSkus) : null;
  }, [text, knownSkus]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
  }

  function commit() {
    if (!preview) return;
    const importable = preview.createCount + preview.updateCount;
    toast.success(
      `Validated ${importable} ${importable === 1 ? "row" : "rows"} (${preview.createCount} new, ${preview.updateCount} updates). Committing imports lands with the backend.`,
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import catalog (CSV / Excel)</DialogTitle>
          <DialogDescription>
            Columns: {CSV_COLUMNS.join(", ")}. Paste CSV or upload a file to validate before import.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <UploadCloud className="size-4" />
              Upload CSV
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} />
            </label>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>
            Load sample
          </Button>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE}
          className="h-28 font-mono text-xs"
          aria-label="CSV content"
        />

        {preview ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="success">{preview.createCount} to create</Badge>
              <Badge variant="info">{preview.updateCount} to update</Badge>
              {preview.errorCount > 0 ? (
                <Badge variant="destructive">{preview.errorCount} with errors</Badge>
              ) : null}
            </div>
            <div className="max-h-[36vh] overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Line</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.results.map((result) => (
                    <TableRow key={result.row.line}>
                      <TableCell className="tabular-nums text-muted-foreground">{result.row.line}</TableCell>
                      <TableCell className="text-sm text-foreground">{result.row.name || "—"}</TableCell>
                      <TableCell className="font-mono text-code-sku">{result.row.sku || "—"}</TableCell>
                      <TableCell>
                        {result.status === "error" ? (
                          <span className="text-xs text-destructive">{result.issues.join(" ")}</span>
                        ) : (
                          <Badge variant={result.status === "create" ? "success" : "info"}>
                            {result.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No rows parsed yet.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={commit}
            disabled={!preview || preview.createCount + preview.updateCount === 0}
          >
            Validate &amp; import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
