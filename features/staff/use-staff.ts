"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDataSource } from "@/lib/data/provider";
import type { EmployeeInput, EmployeeStatus, Id, PermissionKey } from "@/lib/data/types";

export const staffKey = ["staff"] as const;

export function useEmployees() {
  return useQuery({
    queryKey: [...staffKey, "employees"],
    queryFn: () => getDataSource().staff.listEmployees(),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: [...staffKey, "roles"],
    queryFn: () => getDataSource().staff.listRoles(),
  });
}

export function useStaffMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: staffKey });
  return {
    create: useMutation({
      mutationFn: (input: EmployeeInput) => getDataSource().staff.createEmployee(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: Id; input: EmployeeInput }) =>
        getDataSource().staff.updateEmployee(id, input),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: Id; status: EmployeeStatus }) =>
        getDataSource().staff.setEmployeeStatus(id, status),
      onSuccess: invalidate,
    }),
    togglePermission: useMutation({
      mutationFn: ({ roleId, permission, enabled }: { roleId: Id; permission: PermissionKey; enabled: boolean }) =>
        getDataSource().staff.toggleRolePermission(roleId, permission, enabled),
      onSuccess: invalidate,
    }),
  };
}
