import type { PermissionDef } from "@/lib/data/types";

/** UI mirror of the RBAC permission catalog (security.md). */
export const PERMISSION_CATALOG: PermissionDef[] = [
  { key: "pos.sell", label: "Operate POS / sell", group: "Sales" },
  { key: "pos.discount.override", label: "Override discounts > 20%", group: "Sales" },
  { key: "sales.refund", label: "Process refunds", group: "Sales" },
  { key: "drawer.pop", label: "Open cash drawer (pop)", group: "Sales" },
  { key: "inventory.adjust", label: "Adjust stock", group: "Inventory" },
  { key: "inventory.transfer", label: "Transfer stock", group: "Inventory" },
  { key: "products.manage", label: "Manage catalog", group: "Catalog" },
  { key: "purchases.manage", label: "Manage purchases", group: "Catalog" },
  { key: "customers.manage", label: "Manage customers", group: "Catalog" },
  { key: "reports.view", label: "View reports", group: "Admin" },
  { key: "staff.manage", label: "Manage staff & roles", group: "Admin" },
  { key: "settings.manage", label: "Manage settings", group: "Admin" },
];
