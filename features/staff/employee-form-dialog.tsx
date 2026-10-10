"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { toUserMessage } from "@/lib/data/errors";
import type { Employee, Role, Store } from "@/lib/data/types";
import { useStaffMutations } from "./use-staff";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  roles: Role[];
  stores: Store[];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-label-sm uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function EmployeeFormDialog({ open, onOpenChange, employee, roles, stores }: EmployeeFormDialogProps) {
  const { create, update } = useStaffMutations();
  const [fullName, setFullName] = React.useState(employee?.fullName ?? "");
  const [email, setEmail] = React.useState(employee?.email ?? "");
  const [roleId, setRoleId] = React.useState(employee?.roleId ?? roles[0]?.id ?? "");
  const [storeId, setStoreId] = React.useState<string>(employee?.storeId ?? "");
  const [status, setStatus] = React.useState<Employee["status"]>(employee?.status ?? "active");
  const [error, setError] = React.useState<string | null>(null);

  const pending = create.isPending || update.isPending;

  async function submit() {
    if (!fullName.trim()) return setError("Name is required.");
    if (!email.trim() || !email.includes("@")) return setError("A valid email is required.");
    setError(null);
    const input = { fullName, email, roleId, storeId: storeId || null, status };
    try {
      if (employee) {
        await update.mutateAsync({ id: employee.id, input });
        toast.success("Employee updated");
      } else {
        await create.mutateAsync(input);
        toast.success("Employee added");
      }
      onOpenChange(false);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit employee" : "Add employee"}</DialogTitle>
          <DialogDescription>Assign a role and optionally scope to one store.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Employee name" />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@business.com" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Role">
              <NativeSelect value={roleId} onChange={(e) => setRoleId(e.target.value)} aria-label="Role">
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Store scope">
              <NativeSelect value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Store scope">
                <option value="">All stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Status">
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as Employee["status"])} className="sm:w-48">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </NativeSelect>
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Saving…" : employee ? "Save changes" : "Add employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
