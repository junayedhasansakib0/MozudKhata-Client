import { describe, it, expect, beforeEach } from "vitest";

import { ApiError } from "../errors";
import {
  __resetStaff,
  createEmployee,
  listEmployees,
  listRoles,
  setEmployeeStatus,
  toggleRolePermission,
  updateEmployee,
} from "./staff";

describe("mock staff store", () => {
  beforeEach(() => __resetStaff());

  it("seeds the four system roles", () => {
    const roles = listRoles();
    expect(roles.map((r) => r.name).sort()).toEqual(["Cashier", "Inventory Supervisor", "Owner", "Store Manager"]);
  });

  it("toggles a role permission on and off", () => {
    const cashier = listRoles().find((r) => r.name === "Cashier")!;
    expect(cashier.permissions.includes("sales.refund")).toBe(false);
    const added = toggleRolePermission(cashier.id, "sales.refund", true);
    expect(added.permissions.includes("sales.refund")).toBe(true);
    const removed = toggleRolePermission(cashier.id, "sales.refund", false);
    expect(removed.permissions.includes("sales.refund")).toBe(false);
  });

  it("creates, updates, and deactivates an employee", () => {
    const manager = listRoles().find((r) => r.name === "Store Manager")!;
    const created = createEmployee({ fullName: "Taylor Reed", email: "taylor@mozud.example", roleId: manager.id, storeId: null, status: "active" });
    expect(created.roleName).toBe("Store Manager");
    const updated = updateEmployee(created.id, { fullName: "Taylor Reed", email: "taylor@mozud.example", roleId: manager.id, storeId: null, status: "active" });
    expect(updated.fullName).toBe("Taylor Reed");
    const off = setEmployeeStatus(created.id, "inactive");
    expect(off.status).toBe("inactive");
    expect(listEmployees().some((e) => e.id === created.id)).toBe(true);
  });

  it("validates required employee fields", () => {
    const role = listRoles()[0]!;
    expect(() => createEmployee({ fullName: "", email: "x@y.com", roleId: role.id, storeId: null, status: "active" })).toThrowError(ApiError);
  });
});
