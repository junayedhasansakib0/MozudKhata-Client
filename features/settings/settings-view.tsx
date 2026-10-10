"use client";

import * as React from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Bell,
  Building2,
  CreditCard,
  DatabaseBackup,
  Globe,
  Palette,
  Plug,
  Receipt,
  ShieldCheck,
  Store,
  User,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/states/page-header";
import { useSession } from "@/hooks/use-session";
import { useTaxRates } from "@/features/catalog/use-catalog";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SectionId =
  | "business"
  | "profile"
  | "stores"
  | "users"
  | "roles"
  | "currency"
  | "tax"
  | "invoice"
  | "payments"
  | "notifications"
  | "security"
  | "appearance"
  | "language"
  | "integrations"
  | "backup";

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "stores", label: "Stores", icon: Store },
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles", icon: ShieldCheck },
  { id: "currency", label: "Currency & format", icon: Wallet },
  { id: "tax", label: "Tax", icon: Receipt },
  { id: "invoice", label: "Invoice", icon: Receipt },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language", icon: Globe },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "backup", label: "Backup", icon: DatabaseBackup },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Panel({ title, description, children, onSave }: { title: string; description: string; children: React.ReactNode; onSave?: () => void }) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="font-display text-headline-sm font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
      {onSave ? (
        <div className="mt-5 flex justify-end">
          <Button onClick={onSave}>Save changes</Button>
        </div>
      ) : null}
    </Card>
  );
}

export function SettingsView() {
  const [active, setActive] = React.useState<SectionId>("business");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Business, currency, tax, invoice, payments, security, and appearance."
      />
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex flex-wrap gap-1 lg:flex-col" aria-label="Settings sections">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              aria-current={active === section.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                active === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <section.icon className="size-4" />
              {section.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          <SettingsPanel section={active} />
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ section }: { section: SectionId }) {
  switch (section) {
    case "business":
      return <BusinessPanel />;
    case "profile":
      return <ProfilePanel />;
    case "stores":
      return <LinkPanel title="Stores" description="Manage store locations and status." href="/stores" cta="Open Stores & Branches" />;
    case "users":
      return <LinkPanel title="Users" description="Manage employees and their store scope." href="/staff" cta="Open Staff & Roles" />;
    case "roles":
      return <LinkPanel title="Roles & permissions" description="Edit the RBAC permission matrix." href="/staff" cta="Open permission matrix" />;
    case "currency":
      return <CurrencyPanel />;
    case "tax":
      return <TaxPanel />;
    case "invoice":
      return <InvoicePanel />;
    case "payments":
      return <PaymentsPanel />;
    case "notifications":
      return <NotificationsPanel />;
    case "security":
      return <SecurityPanel />;
    case "appearance":
      return <AppearancePanel />;
    case "language":
      return <LanguagePanel />;
    case "integrations":
      return <IntegrationsPanel />;
    case "backup":
      return <BackupPanel />;
  }
}

function LinkPanel({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
  return (
    <Panel title={title} description={description}>
      <Button asChild variant="outline">
        <Link href={href}>{cta}</Link>
      </Button>
    </Panel>
  );
}

function BusinessPanel() {
  const { data: session } = useSession();
  return (
    <Panel title="Business" description="Your organization's identity and base configuration." onSave={() => toast.success("Business settings saved")}>
      <Field label="Business name">
        <Input key={session?.tenant.name} defaultValue={session?.tenant.name ?? ""} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Base currency">
          <Input value={session?.tenant.baseCurrency ?? "USD"} readOnly className="font-mono" />
        </Field>
        <Field label="Locale">
          <Input value={session?.tenant.locale ?? "en-US"} readOnly className="font-mono" />
        </Field>
      </div>
    </Panel>
  );
}

function ProfilePanel() {
  const { data: session } = useSession();
  return (
    <Panel title="Profile" description="Your personal account details." onSave={() => toast.success("Profile saved")}>
      <Field label="Full name">
        <Input key={session?.user.fullName} defaultValue={session?.user.fullName ?? ""} />
      </Field>
      <Field label="Email">
        <Input value={session?.user.email ?? ""} readOnly />
      </Field>
    </Panel>
  );
}

function CurrencyPanel() {
  const [symbolPos, setSymbolPos] = React.useState("prefix");
  const [grouping, setGrouping] = React.useState("comma");
  return (
    <Panel title="Currency & format" description="How monetary amounts are displayed (amounts stay in minor units)." onSave={() => toast.success("Currency format saved")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Symbol position">
          <NativeSelect value={symbolPos} onChange={(e) => setSymbolPos(e.target.value)}>
            <option value="prefix">Prefix ($1,234.00)</option>
            <option value="suffix">Suffix (1.234,00 $)</option>
          </NativeSelect>
        </Field>
        <Field label="Grouping">
          <NativeSelect value={grouping} onChange={(e) => setGrouping(e.target.value)}>
            <option value="comma">1,234.56</option>
            <option value="dot">1.234,56</option>
          </NativeSelect>
        </Field>
      </div>
      <p className="text-sm text-muted-foreground">Preview: {formatMoney({ amountMinor: 123456, currency: "USD" })}</p>
    </Panel>
  );
}

function TaxPanel() {
  const { data: rates } = useTaxRates();
  return (
    <Panel title="Tax" description="Configured tax rates (multi-line tax supported).">
      <ul className="divide-y divide-border rounded-lg border border-border">
        {(rates ?? []).map((rate) => (
          <li key={rate.id} className="flex items-center justify-between p-3 text-sm">
            <span className="text-foreground">{rate.name}</span>
            <span className="font-mono text-code-sku text-muted-foreground">{(rate.rate * 100).toFixed(3)}%</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Tax-inclusive vs. exclusive pricing is a backend configuration decision.</p>
    </Panel>
  );
}

function InvoicePanel() {
  const [prefix, setPrefix] = React.useState("INV-");
  const [footer, setFooter] = React.useState("Thank you for your business!");
  return (
    <Panel title="Invoice" description="Invoice numbering and receipt footer." onSave={() => toast.success("Invoice settings saved")}>
      <Field label="Number prefix">
        <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="font-mono" />
      </Field>
      <Field label="Receipt footer">
        <Input value={footer} onChange={(e) => setFooter(e.target.value)} />
      </Field>
    </Panel>
  );
}

function PaymentsPanel() {
  const [cash, setCash] = React.useState(true);
  const [card, setCard] = React.useState(true);
  const [qr, setQr] = React.useState(true);
  const [credit, setCredit] = React.useState(true);
  const row = (label: string, value: boolean, set: (v: boolean) => void) => (
    <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <Switch checked={value} onCheckedChange={set} aria-label={label} />
    </label>
  );
  return (
    <Panel title="Payments" description="Accepted tender types. Processor keys live only on the backend." onSave={() => toast.success("Payment methods saved")}>
      {row("Cash", cash, setCash)}
      {row("Card (EMV/NFC)", card, setCard)}
      {row("QR wallet", qr, setQr)}
      {row("House credit", credit, setCredit)}
    </Panel>
  );
}

function NotificationsPanel() {
  const [lowStock, setLowStock] = React.useState(true);
  const [reorder, setReorder] = React.useState(true);
  const [shift, setShift] = React.useState(false);
  const row = (label: string, value: boolean, set: (v: boolean) => void) => (
    <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <Switch checked={value} onCheckedChange={set} aria-label={label} />
    </label>
  );
  return (
    <Panel title="Notifications" description="Which alerts you receive." onSave={() => toast.success("Notification preferences saved")}>
      {row("Low-stock alerts", lowStock, setLowStock)}
      {row("Reorder draft ready", reorder, setReorder)}
      {row("Shift reconciliation", shift, setShift)}
    </Panel>
  );
}

function SecurityPanel() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  function save() {
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("Passwords do not match.");
    setError(null);
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated");
  }
  return (
    <Panel title="Security" description="Change your password. MFA for admins is planned (Phase 2).">
      <Field label="Current password">
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password">
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field label="Confirm new password">
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end">
        <Button onClick={save}>Update password</Button>
      </div>
    </Panel>
  );
}

function AppearancePanel() {
  const { theme, setTheme } = useTheme();
  const options = ["light", "dark", "system"];
  return (
    <Panel title="Appearance" description="Theme preference for this device.">
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            className={cn(
              "flex-1 rounded-lg border p-3 text-sm font-medium capitalize transition-colors",
              (theme ?? "system") === option ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </Panel>
  );
}

function LanguagePanel() {
  const [lang, setLang] = React.useState("en-US");
  const [rtl, setRtl] = React.useState(false);
  return (
    <Panel title="Language" description="Interface language and layout direction." onSave={() => toast.success("Language saved")}>
      <Field label="Language">
        <NativeSelect value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español</option>
          <option value="ar">العربية</option>
          <option value="he">עברית</option>
        </NativeSelect>
      </Field>
      <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
        <span className="font-medium text-foreground">Right-to-left layout</span>
        <Switch checked={rtl} onCheckedChange={setRtl} aria-label="Right-to-left layout" />
      </label>
    </Panel>
  );
}

function IntegrationsPanel() {
  return (
    <Panel title="Integrations" description="Connect hardware and third-party services.">
      <ul className="divide-y divide-border rounded-lg border border-border text-sm">
        {["Receipt printer", "Barcode scanner", "Card terminal", "Accounting export"].map((name) => (
          <li key={name} className="flex items-center justify-between p-3">
            <span className="text-foreground">{name}</span>
            <Button variant="outline" size="sm" onClick={() => toast.success(`${name} — connection flow is a backend concern`)}>
              Connect
            </Button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function BackupPanel() {
  return (
    <Panel title="Backup" description="Data export and backup cadence (managed by the platform).">
      <p className="text-sm text-muted-foreground">
        Backups are configured on the database provider. Export your catalog and sales from their respective pages.
      </p>
      <Button variant="outline" onClick={() => toast.success("Backup requested")}>
        Request a backup
      </Button>
    </Panel>
  );
}
