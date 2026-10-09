import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Package,
  ReceiptText,
  ScanBarcode,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<LucideProps>;
  badge?: string;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    heading: "Core Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "POS Terminal", href: "/pos", icon: ScanBarcode, badge: "Live" },
      { label: "Sales & Orders", href: "/sales", icon: ReceiptText },
      { label: "Inventory & Stock", href: "/inventory", icon: Boxes },
    ],
  },
  {
    heading: "Catalog & Supply",
    items: [
      { label: "Products & Variants", href: "/products", icon: Package },
      { label: "Purchases & POs", href: "/purchases", icon: ClipboardList },
      { label: "Suppliers", href: "/suppliers", icon: Truck },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    heading: "Operations & Finance",
    items: [
      { label: "Expenses & Cashflow", href: "/expenses", icon: Wallet },
      { label: "Analytics & Reports", href: "/reports", icon: BarChart3 },
      { label: "Staff & Roles", href: "/staff", icon: ShieldCheck },
      { label: "Stores & Branches", href: "/stores", icon: Building2 },
    ],
  },
];

/** Flat list for the command menu and route lookups. */
export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);
