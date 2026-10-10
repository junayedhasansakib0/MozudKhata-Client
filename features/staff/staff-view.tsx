"use client";

import * as React from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/use-session";
import { toUserMessage } from "@/lib/data/errors";
import type { Employee } from "@/lib/data/types";
import { formatRelativeTime } from "@/lib/format";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { PermissionMatrix } from "./permission-matrix";
import { useEmployees, useRoles, useStaffMutations } from "./use-staff";

export function StaffView() {
  const { data: session } = useSession();
  const stores = session?.stores ?? [];
  const employeesQuery = useEmployees();
  const rolesQuery = useRoles();
  const { setStatus } = useStaffMutations();
  const [tab, setTab] = React.useState("employees");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Employee | null>(null);

  const employees = employeesQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  async function toggle(employee: Employee) {
    try {
      await setStatus.mutateAsync({
        id: employee.id,
        status: employee.status === "active" ? "inactive" : "active",
      });
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations &amp; Finance"
        title="Staff & Roles"
        description="Employees, roles, and the permission matrix (RBAC)."
        actions={
          tab === "employees" ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add employee
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          {employeesQuery.isError ? (
            <ErrorState error={employeesQuery.error} onRetry={() => employeesQuery.refetch()} />
          ) : employeesQuery.isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No employees"
              description="Add an employee to assign roles and store access."
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add employee
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Store scope</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground">
                          {employee.fullName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {employee.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{employee.roleName}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {employee.storeName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {employee.lastActiveAt ? formatRelativeTime(employee.lastActiveAt) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={employee.status === "active"}
                          onCheckedChange={() => toggle(employee)}
                          aria-label={`${employee.fullName} is ${employee.status}`}
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => {
                            setEditing(employee);
                            setFormOpen(true);
                          }}
                          aria-label="Edit employee"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>

      {formOpen ? (
        <EmployeeFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          employee={editing}
          roles={roles}
          stores={stores}
        />
      ) : null}
    </div>
  );
}
