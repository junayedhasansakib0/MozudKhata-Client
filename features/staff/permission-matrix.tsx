"use client";

import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toUserMessage } from "@/lib/data/errors";
import type { Role } from "@/lib/data/types";
import { PERMISSION_CATALOG } from "./permissions";
import { useRoles, useStaffMutations } from "./use-staff";

export function PermissionMatrix() {
  const rolesQuery = useRoles();
  const { togglePermission } = useStaffMutations();
  const roles = rolesQuery.data ?? [];

  if (rolesQuery.isLoading) return <Skeleton className="h-96 w-full" />;

  async function toggle(role: Role, permission: (typeof PERMISSION_CATALOG)[number]["key"], enabled: boolean) {
    try {
      await togglePermission.mutateAsync({ roleId: role.id, permission, enabled });
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  const groups = [...new Set(PERMISSION_CATALOG.map((p) => p.group))];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="min-w-[220px]">Permission</TableHead>
            {roles.map((role) => (
              <TableHead key={role.id} className="text-center">
                {role.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <GroupRows key={group} group={group} roles={roles} onToggle={toggle} busy={togglePermission.isPending} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GroupRows({
  group,
  roles,
  onToggle,
  busy,
}: {
  group: string;
  roles: Role[];
  onToggle: (role: Role, permission: (typeof PERMISSION_CATALOG)[number]["key"], enabled: boolean) => void;
  busy: boolean;
}) {
  const perms = PERMISSION_CATALOG.filter((p) => p.group === group);
  return (
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={roles.length + 1} className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {group}
        </TableCell>
      </TableRow>
      {perms.map((perm) => (
        <TableRow key={perm.key}>
          <TableCell className="text-sm text-foreground">{perm.label}</TableCell>
          {roles.map((role) => {
            const enabled = role.permissions.includes(perm.key);
            return (
              <TableCell key={role.id} className="text-center">
                <div className="flex justify-center">
                  <Checkbox
                    checked={enabled}
                    disabled={busy || (role.isSystem && role.name === "Owner")}
                    onCheckedChange={(next) => onToggle(role, perm.key, next)}
                    aria-label={`${role.name}: ${perm.label}`}
                  />
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
