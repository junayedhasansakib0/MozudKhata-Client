import type {
  Employee,
  EmployeeInput,
  Id,
  PermissionDef,
  PermissionKey,
  Role,
} from "../types";
import { ApiError } from "../errors";
import { seedStores, seedUser } from "./seed";

/**
 * In-memory staff + RBAC store for Stage 1: employees, roles, and the permission
 * matrix. Mirrors security.md seeded roles. Removed in Stage 3. Not production data.
 */

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

const ALL_PERMISSIONS = PERMISSION_CATALOG.map((p) => p.key);

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function storeName(storeId: Id | null): string {
  if (!storeId) return "All stores";
  return seedStores.find((s) => s.id === storeId)?.name ?? "Store";
}

function seedRoles(): Role[] {
  return [
    { id: "role_owner", name: "Owner", isSystem: true, permissions: [...ALL_PERMISSIONS] },
    {
      id: "role_manager",
      name: "Store Manager",
      isSystem: true,
      permissions: [
        "pos.sell",
        "pos.discount.override",
        "sales.refund",
        "drawer.pop",
        "inventory.adjust",
        "inventory.transfer",
        "products.manage",
        "purchases.manage",
        "customers.manage",
        "reports.view",
      ],
    },
    {
      id: "role_cashier",
      name: "Cashier",
      isSystem: true,
      permissions: ["pos.sell", "customers.manage"],
    },
    {
      id: "role_inventory",
      name: "Inventory Supervisor",
      isSystem: true,
      permissions: ["inventory.adjust", "inventory.transfer", "products.manage", "purchases.manage", "reports.view"],
    },
  ];
}

function seedEmployees(): Employee[] {
  const [downtown, north, riverside] = seedStores;
  return [
    { id: "emp_alex", fullName: seedUser.fullName, email: seedUser.email, roleId: "role_manager", roleName: "Store Manager", storeId: null, storeName: "All stores", status: "active", lastActiveAt: new Date(Date.now() - 5 * 60_000).toISOString() },
    { id: "emp_priya", fullName: "Priya Shah", email: "priya@mozud.example", roleId: "role_owner", roleName: "Owner", storeId: null, storeName: "All stores", status: "active", lastActiveAt: new Date(Date.now() - 3 * 3_600_000).toISOString() },
    { id: "emp_jordan", fullName: "Jordan Lee", email: "jordan@mozud.example", roleId: "role_cashier", roleName: "Cashier", storeId: downtown!.id, storeName: downtown!.name, status: "active", lastActiveAt: new Date(Date.now() - 40 * 60_000).toISOString() },
    { id: "emp_sam", fullName: "Sam Rivera", email: "sam@mozud.example", roleId: "role_inventory", roleName: "Inventory Supervisor", storeId: north!.id, storeName: north!.name, status: "active" },
    { id: "emp_mia", fullName: "Mia Chen", email: "mia@mozud.example", roleId: "role_cashier", roleName: "Cashier", storeId: riverside!.id, storeName: riverside!.name, status: "inactive" },
  ];
}

const state = { roles: seedRoles(), employees: seedEmployees() };

function roleName(roleId: Id): string {
  return state.roles.find((r) => r.id === roleId)?.name ?? "Role";
}

// --- Roles ---

export function listRoles(): Role[] {
  return state.roles.map(clone);
}

export function updateRolePermissions(roleId: Id, permissions: PermissionKey[]): Role {
  const role = state.roles.find((r) => r.id === roleId);
  if (!role) throw new ApiError("NOT_FOUND", "Role not found.", { status: 404 });
  role.permissions = [...new Set(permissions)];
  return clone(role);
}

export function toggleRolePermission(roleId: Id, permission: PermissionKey, enabled: boolean): Role {
  const role = state.roles.find((r) => r.id === roleId);
  if (!role) throw new ApiError("NOT_FOUND", "Role not found.", { status: 404 });
  const set = new Set(role.permissions);
  if (enabled) set.add(permission);
  else set.delete(permission);
  role.permissions = [...set];
  return clone(role);
}

// --- Employees ---

export function listEmployees(): Employee[] {
  return state.employees.map(clone);
}

export function createEmployee(input: EmployeeInput): Employee {
  if (!input.fullName.trim()) throw new ApiError("VALIDATION_FAILED", "Name is required.", { status: 422 });
  if (!input.email.trim()) throw new ApiError("VALIDATION_FAILED", "Email is required.", { status: 422 });
  const employee: Employee = {
    id: uid("emp"),
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    roleId: input.roleId,
    roleName: roleName(input.roleId),
    storeId: input.storeId,
    storeName: storeName(input.storeId),
    status: input.status,
  };
  state.employees.push(employee);
  return clone(employee);
}

export function updateEmployee(id: Id, input: EmployeeInput): Employee {
  const employee = state.employees.find((e) => e.id === id);
  if (!employee) throw new ApiError("NOT_FOUND", "Employee not found.", { status: 404 });
  employee.fullName = input.fullName.trim() || employee.fullName;
  employee.email = input.email.trim().toLowerCase() || employee.email;
  employee.roleId = input.roleId;
  employee.roleName = roleName(input.roleId);
  employee.storeId = input.storeId;
  employee.storeName = storeName(input.storeId);
  employee.status = input.status;
  return clone(employee);
}

export function setEmployeeStatus(id: Id, status: Employee["status"]): Employee {
  const employee = state.employees.find((e) => e.id === id);
  if (!employee) throw new ApiError("NOT_FOUND", "Employee not found.", { status: 404 });
  employee.status = status;
  return clone(employee);
}

export function __resetStaff(): void {
  state.roles = seedRoles();
  state.employees = seedEmployees();
}
