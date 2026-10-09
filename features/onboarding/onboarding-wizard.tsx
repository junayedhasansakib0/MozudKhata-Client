"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  DollarSign,
  Package,
  PartyPopper,
  Percent,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { Brand } from "@/components/layout/brand";
import { cn } from "@/lib/utils";
import { fieldErrors } from "@/lib/forms";
import {
  businessStepSchema,
  storeStepSchema,
  currencyStepSchema,
  taxStepSchema,
  CURRENCIES,
  COUNTRIES,
} from "./schemas";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const STEPS = [
  { title: "Business", description: "Tell us about your business.", icon: Building2 },
  { title: "First store", description: "Add your first location.", icon: Store },
  { title: "Currency", description: "Set your base currency.", icon: DollarSign },
  { title: "Tax", description: "Configure a default tax rate.", icon: Percent },
  { title: "Products", description: "Get your catalog started.", icon: Package },
  { title: "All set", description: "You're ready to go.", icon: PartyPopper },
] as const;

interface OnboardingData {
  businessName: string;
  country: string;
  industry: string;
  storeName: string;
  storeCode: string;
  city: string;
  baseCurrency: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: string;
  productChoice: "import" | "manual" | "skip";
}

const INITIAL: OnboardingData = {
  businessName: "",
  country: "",
  industry: "",
  storeName: "",
  storeCode: "",
  city: "",
  baseCurrency: "USD",
  taxEnabled: true,
  taxName: "Sales Tax",
  taxRate: "8.25",
  productChoice: "skip",
};

const PRODUCT_CHOICES: { value: OnboardingData["productChoice"]; label: string; hint: string }[] = [
  { value: "import", label: "Import a CSV / Excel", hint: "Bring an existing catalog." },
  { value: "manual", label: "Add products manually", hint: "Start from scratch in the app." },
  { value: "skip", label: "Skip for now", hint: "Set up your catalog later." },
];

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState<OnboardingData>(INITIAL);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function set<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(current: number): boolean {
    const result =
      current === 0
        ? businessStepSchema.safeParse(data)
        : current === 1
          ? storeStepSchema.safeParse(data)
          : current === 2
            ? currencyStepSchema.safeParse(data)
            : current === 3
              ? taxStepSchema.safeParse(data)
              : null;
    if (result && !result.success) {
      setErrors(fieldErrors(result.error));
      return false;
    }
    setErrors({});
    return true;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function back() {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  }

  function finish() {
    toast("You're all set!", { description: "Welcome to MozudKhata." });
    router.replace("/dashboard");
  }

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step] ?? STEPS[0];

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 flex justify-center">
        <Brand />
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="mt-1 font-display text-headline-md font-bold tracking-tight text-foreground">
            {current.title}
          </h1>
          <p className="text-sm text-muted-foreground">{current.description}</p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {step === 0 ? (
            <>
              <FormField label="Business name" htmlFor="businessName" error={errors.businessName}>
                <Input
                  id="businessName"
                  value={data.businessName}
                  onChange={(event) => set("businessName", event.target.value)}
                  placeholder="Mozud Coffee Co."
                />
              </FormField>
              <FormField label="Country" htmlFor="country" error={errors.country}>
                <select
                  id="country"
                  className={SELECT_CLASS}
                  value={data.country}
                  onChange={(event) => set("country", event.target.value)}
                >
                  <option value="">Select a country…</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Industry (optional)" htmlFor="industry">
                <Input
                  id="industry"
                  value={data.industry}
                  onChange={(event) => set("industry", event.target.value)}
                  placeholder="Café / Retail / Wholesale"
                />
              </FormField>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <FormField label="Store name" htmlFor="storeName" error={errors.storeName}>
                <Input
                  id="storeName"
                  value={data.storeName}
                  onChange={(event) => set("storeName", event.target.value)}
                  placeholder="Downtown Flagship"
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Store code" htmlFor="storeCode" error={errors.storeCode}>
                  <Input
                    id="storeCode"
                    value={data.storeCode}
                    onChange={(event) => set("storeCode", event.target.value)}
                    placeholder="AUS-01"
                  />
                </FormField>
                <FormField label="City" htmlFor="city" error={errors.city}>
                  <Input
                    id="city"
                    value={data.city}
                    onChange={(event) => set("city", event.target.value)}
                    placeholder="Austin, TX"
                  />
                </FormField>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <FormField
              label="Base currency"
              htmlFor="baseCurrency"
              error={errors.baseCurrency}
              hint="Amounts are stored in this currency's minor units."
            >
              <select
                id="baseCurrency"
                className={SELECT_CLASS}
                value={data.baseCurrency}
                onChange={(event) => set("baseCurrency", event.target.value)}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}
          {step === 3 ? (
            <>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={data.taxEnabled}
                  onChange={(event) => set("taxEnabled", event.target.checked)}
                  className="size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring"
                />
                Charge tax on sales
              </label>
              {data.taxEnabled ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Tax name" htmlFor="taxName" error={errors.taxName}>
                    <Input
                      id="taxName"
                      value={data.taxName}
                      onChange={(event) => set("taxName", event.target.value)}
                      placeholder="Sales Tax / VAT / GST"
                    />
                  </FormField>
                  <FormField label="Rate (%)" htmlFor="taxRate" error={errors.taxRate}>
                    <Input
                      id="taxRate"
                      inputMode="decimal"
                      value={data.taxRate}
                      onChange={(event) => set("taxRate", event.target.value)}
                      placeholder="8.25"
                    />
                  </FormField>
                </div>
              ) : null}
            </>
          ) : null}

          {step === 4 ? (
            <div className="space-y-2">
              {PRODUCT_CHOICES.map((choice) => {
                const selected = data.productChoice === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => set("productChoice", choice.value)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md border p-3 text-start transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 items-center justify-center rounded-full border",
                        selected ? "border-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {choice.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">{choice.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <PartyPopper className="size-6" />
                </div>
              </div>
              <dl className="divide-y divide-border rounded-md border border-border">
                <SummaryRow label="Business" value={data.businessName || "—"} />
                <SummaryRow
                  label="First store"
                  value={data.storeName ? `${data.storeName} (${data.storeCode || "—"})` : "—"}
                />
                <SummaryRow label="Base currency" value={data.baseCurrency} />
                <SummaryRow
                  label="Tax"
                  value={data.taxEnabled ? `${data.taxName} · ${data.taxRate}%` : "No tax"}
                />
                <SummaryRow
                  label="Products"
                  value={PRODUCT_CHOICES.find((c) => c.value === data.productChoice)?.label ?? "—"}
                />
              </dl>
              <p className="text-center text-sm text-muted-foreground">
                Your workspace is ready. You can refine any of this in Settings.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          {isLast ? (
            <Button onClick={finish}>
              Go to dashboard
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={next}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
