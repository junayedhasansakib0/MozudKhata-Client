"use client";

import * as React from "react";
import { Plus, Sparkles, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { generateVariants, type OptionType } from "./catalog-math";
import { blankVariant, type VariantDraft } from "./form-model";

interface VariantMatrixEditorProps {
  baseSku: string;
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

function deriveOptions(variants: VariantDraft[]): OptionType[] {
  const map = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const [name, value] of Object.entries(v.attributes)) {
      const set = map.get(name) ?? new Set<string>();
      set.add(value);
      map.set(name, set);
    }
  }
  return [...map.entries()].map(([name, values]) => ({ name, values: [...values] }));
}

export function VariantMatrixEditor({ baseSku, variants, onChange }: VariantMatrixEditorProps) {
  const [options, setOptions] = React.useState<OptionType[]>(() => deriveOptions(variants));
  const [valueDrafts, setValueDrafts] = React.useState<Record<number, string>>({});

  function patchVariant(index: number, patch: Partial<VariantDraft>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeVariant(index: number) {
    if (variants.length <= 1) return;
    onChange(variants.filter((_, i) => i !== index));
  }

  function addManualVariant() {
    onChange([...variants, blankVariant({ variantName: `Variant ${variants.length + 1}` })]);
  }

  function regenerate() {
    const generated = generateVariants(options, baseSku);
    if (generated.length === 0) return;
    const byName = new Map(variants.map((v) => [v.variantName, v]));
    onChange(
      generated.map((g) => {
        const existing = byName.get(g.variantName);
        return blankVariant({
          id: existing?.id,
          variantName: g.variantName,
          attributes: g.attributes,
          sku: existing?.sku || g.skuSuffix,
          barcode: existing?.barcode ?? "",
          costMajor: existing?.costMajor ?? "",
          sellMajor: existing?.sellMajor ?? "",
          unit: existing?.unit ?? "each",
          status: existing?.status ?? "active",
        });
      }),
    );
  }

  return (
    <div className="space-y-5">
      <OptionsEditor
        options={options}
        setOptions={setOptions}
        valueDrafts={valueDrafts}
        setValueDrafts={setValueDrafts}
        onGenerate={regenerate}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Variants ({variants.length})
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={addManualVariant}>
            <Plus className="size-4" />
            Add variant
          </Button>
        </div>
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div
              key={variant.id ?? index}
              className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_auto]"
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <LabeledField label="Variant">
                  <Input
                    value={variant.variantName}
                    onChange={(e) => patchVariant(index, { variantName: e.target.value })}
                    aria-label={`Variant ${index + 1} name`}
                  />
                </LabeledField>
                <LabeledField label="SKU">
                  <Input
                    value={variant.sku}
                    onChange={(e) => patchVariant(index, { sku: e.target.value })}
                    className="font-mono uppercase"
                    aria-label={`Variant ${index + 1} SKU`}
                  />
                </LabeledField>
                <LabeledField label="Cost">
                  <Input
                    value={variant.costMajor}
                    onChange={(e) => patchVariant(index, { costMajor: e.target.value })}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="font-mono"
                    aria-label={`Variant ${index + 1} cost`}
                  />
                </LabeledField>
                <LabeledField label="Sell">
                  <Input
                    value={variant.sellMajor}
                    onChange={(e) => patchVariant(index, { sellMajor: e.target.value })}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="font-mono"
                    aria-label={`Variant ${index + 1} sell`}
                  />
                </LabeledField>
              </div>
              <div className="flex items-center justify-end gap-3 sm:flex-col sm:justify-center">
                <Switch
                  checked={variant.status === "active"}
                  onCheckedChange={(on) => patchVariant(index, { status: on ? "active" : "inactive" })}
                  aria-label={`Variant ${index + 1} active`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={variants.length <= 1}
                  onClick={() => removeVariant(index)}
                  aria-label={`Remove variant ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

interface OptionsEditorProps {
  options: OptionType[];
  setOptions: React.Dispatch<React.SetStateAction<OptionType[]>>;
  valueDrafts: Record<number, string>;
  setValueDrafts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onGenerate: () => void;
}

function OptionsEditor({
  options,
  setOptions,
  valueDrafts,
  setValueDrafts,
  onGenerate,
}: OptionsEditorProps) {
  function addOption() {
    setOptions((prev) => [...prev, { name: "", values: [] }]);
  }
  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }
  function renameOption(index: number, name: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, name } : o)));
  }
  function addValue(index: number) {
    const value = (valueDrafts[index] ?? "").trim();
    if (!value) return;
    setOptions((prev) =>
      prev.map((o, i) => (i === index && !o.values.includes(value) ? { ...o, values: [...o.values, value] } : o)),
    );
    setValueDrafts((prev) => ({ ...prev, [index]: "" }));
  }
  function removeValue(index: number, value: string) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, values: o.values.filter((v) => v !== value) } : o)),
    );
  }

  const canGenerate = options.some((o) => o.name.trim() && o.values.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Variant matrix setup
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={addOption}>
          <Plus className="size-4" />
          Add option
        </Button>
      </div>

      {options.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          Single-item product. Add an option (e.g. Size, Color) to build a variant matrix.
        </p>
      ) : (
        options.map((option, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Input
                value={option.name}
                onChange={(e) => renameOption(index, e.target.value)}
                placeholder={`Option ${index + 1} name (e.g. Size)`}
                aria-label={`Option ${index + 1} name`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => removeOption(index)}
                aria-label={`Remove option ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {option.values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 font-mono text-code-sku text-foreground shadow-sm"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValue(index, value)}
                    aria-label={`Remove ${value}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <Input
                value={valueDrafts[index] ?? ""}
                onChange={(e) => setValueDrafts((prev) => ({ ...prev, [index]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addValue(index);
                  }
                }}
                placeholder="+ Add value, press Enter"
                className="h-8 w-40"
                aria-label={`Add value to option ${index + 1}`}
              />
            </div>
          </div>
        ))
      )}

      {canGenerate ? (
        <Button type="button" variant="secondary" size="sm" onClick={onGenerate} className={cn("w-full")}>
          <Sparkles className="size-4" />
          Generate variants from options
        </Button>
      ) : null}
    </div>
  );
}
