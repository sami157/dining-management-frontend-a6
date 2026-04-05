'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, RotateCcw, Save, ShieldCheck, UserX } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { RoleProtectedRoute } from "@/components/auth/protected-route";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { rollbackFinalizedMonth, getFinalizedMonths } from "@/lib/api/finance";
import { deactivateUser, getUsers, updateUserById, updateUserRole } from "@/lib/api/users";
import { queryKeys } from "@/lib/query/keys";
import type { AppUser, UserRole } from "@/lib/types/app-user";
import type { FinalizedMonth } from "@/lib/types/finance";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const roleOptions: UserRole[] = ["MEMBER", "MANAGER", "ADMIN"];
const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, 1);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return monthFormatter.format(parsed);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not available";
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00+06:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return shortDateFormatter.format(parsed);
};

const isMonthLocked = (finalization?: FinalizedMonth | null) =>
  Boolean(finalization?.finalizedAt) && !finalization?.rolledBackAt;

const getMonthStatusLabel = (finalization?: FinalizedMonth | null) =>
  isMonthLocked(finalization) ? "Locked" : finalization?.rolledBackAt ? "Rolled back" : "Open";

function UserPicker({
  value,
  users,
  onChange,
  placeholder = "Select user",
}: {
  value: string;
  users: AppUser[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      user.name.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      (user.mobile ?? "").toLowerCase().includes(normalizedSearch)
    );
  });

  const selectedUser = users.find((user) => user.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selectedUser && "text-muted-foreground")}>
            {selectedUser ? selectedUser.name : placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="border-b p-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search user..."
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredUsers.length ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className="focus:bg-accent focus:text-accent-foreground flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent"
                onClick={() => {
                  onChange(user.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.email} | {roleLabels[user.role]}
                  </span>
                </span>
                <Check className={cn("size-4 shrink-0", user.id === value ? "opacity-100" : "opacity-0")} />
              </button>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">No user found.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AdminActionsPageContent() {
  const queryClient = useQueryClient();
  const { appUser, refreshAppUser } = useAuth();
  const [selectedRoleUserId, setSelectedRoleUserId] = useState("");
  const [roleDraft, setRoleDraft] = useState<UserRole>("MEMBER");

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getUsers(),
  });
  const finalizedMonthsQuery = useQuery({
    queryKey: ["finance", "finalized-months"],
    queryFn: () => getFinalizedMonths(),
  });

  const users = (usersQuery.data ?? [])
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name) || left.email.localeCompare(right.email));
  const usersById = new Map(users.map((user) => [user.id, user] as const));
  const selectedRoleUser = users.find((user) => user.id === selectedRoleUserId) ?? null;
  const finalizedMonths = (finalizedMonthsQuery.data ?? [])
    .slice()
    .sort((left, right) => right.month.localeCompare(left.month));

  const refreshAdminState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
      queryClient.invalidateQueries({ queryKey: ["finance", "finalized-months"] }),
      queryClient.invalidateQueries({ queryKey: ["finance", "deposits"] }),
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["stats", "overview"] }),
      queryClient.invalidateQueries({ queryKey: ["stats", "managers"] }),
      queryClient.invalidateQueries({ queryKey: ["stats", "monthly"] }),
      queryClient.invalidateQueries({ queryKey: ["stats", "public"] }),
      queryClient.invalidateQueries({ queryKey: ["history"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] }),
      queryClient.invalidateQueries({ queryKey: ["member-registrations"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myRegistrations }),
      queryClient.invalidateQueries({ queryKey: ["upcoming-schedules"] }),
    ]);
    await refreshAppUser();
  };

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => updateUserRole(userId, role),
    onSuccess: async (updatedUser) => {
      await refreshAdminState();
      setSelectedRoleUserId(updatedUser.id);
      setRoleDraft(updatedUser.role);
      toast.success(`Role updated to ${roleLabels[updatedUser.role]}.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update user role.");
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: async (updatedUser) => {
      await refreshAdminState();
      setSelectedRoleUserId(updatedUser.id);
      setRoleDraft(updatedUser.role);
      toast.success(`${updatedUser.name} has been deactivated.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to deactivate user.");
    },
  });

  const reactivateUserMutation = useMutation({
    mutationFn: (userId: string) => updateUserById(userId, { isActive: true }),
    onSuccess: async (updatedUser) => {
      await refreshAdminState();
      setSelectedRoleUserId(updatedUser.id);
      setRoleDraft(updatedUser.role);
      toast.success(`${updatedUser.name} has been reactivated.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to reactivate user.");
    },
  });

  const rollbackMonthMutation = useMutation({
    mutationFn: rollbackFinalizedMonth,
    onSuccess: async () => {
      await refreshAdminState();
      toast.success("Month rollback completed.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to roll back month.");
    },
  });

  if (usersQuery.isPending || finalizedMonthsQuery.isPending) {
    return <LoadingState label="Loading admin actions..." />;
  }

  if (usersQuery.isError || finalizedMonthsQuery.isError) {
    return <LoadingState label="We couldn't load admin actions." />;
  }

  const handleRoleUserChange = (userId: string) => {
    setSelectedRoleUserId(userId);

    const nextUser = users.find((user) => user.id === userId);
    setRoleDraft(nextUser?.role ?? "MEMBER");
  };

  const handleRoleSave = async () => {
    if (!selectedRoleUser) {
      toast.error("Select a user first.");
      return;
    }

    if (selectedRoleUser.id === appUser?.id) {
      toast.error("You cannot change your own role.");
      return;
    }

    if (selectedRoleUser.role === roleDraft) {
      toast.error("Choose a different role before saving.");
      return;
    }

    await updateUserRoleMutation.mutateAsync({
      userId: selectedRoleUser.id,
      role: roleDraft,
    });
  };

  const handleDeactivateUser = async () => {
    if (!selectedRoleUser) {
      toast.error("Select a user first.");
      return;
    }

    if (selectedRoleUser.id === appUser?.id) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    if (!selectedRoleUser.isActive) {
      toast.error("That user is already inactive.");
      return;
    }

    await deactivateUserMutation.mutateAsync(selectedRoleUser.id);
  };

  const handleReactivateUser = async () => {
    if (!selectedRoleUser) {
      toast.error("Select a user first.");
      return;
    }

    if (selectedRoleUser.isActive) {
      toast.error("That user is already active.");
      return;
    }

    await reactivateUserMutation.mutateAsync(selectedRoleUser.id);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageIntro
        eyebrow="Admin"
        title="Admin Actions"
        description="Manage admin-only operations like role assignment and finalization rollback from one place."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            <span>Role Assignment</span>
          </CardTitle>
          <CardDescription>Select a user, choose a new role, and save the change.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_auto]">
          <div className="space-y-2">
            <Label>Select user</Label>
            {users.length ? (
              <UserPicker
                value={selectedRoleUserId}
                users={users}
                onChange={handleRoleUserChange}
                placeholder="Search and select user"
              />
            ) : (
              <div className="flex h-10 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">
                No users available.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={roleDraft}
              onValueChange={(value) => setRoleDraft(value as UserRole)}
              disabled={!selectedRoleUser || updateUserRoleMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <Button
              type="button"
              onClick={handleRoleSave}
              disabled={
                !selectedRoleUser ||
                selectedRoleUser.id === appUser?.id ||
                updateUserRoleMutation.isPending ||
                selectedRoleUser.role === roleDraft
              }
            >
              {updateUserRoleMutation.isPending ? <Spinner className="size-4" /> : <Save />}
              <span>Save role</span>
            </Button>
            {selectedRoleUser?.isActive && selectedRoleUser.id !== appUser?.id ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeactivateUser}
                disabled={deactivateUserMutation.isPending}
              >
                {deactivateUserMutation.isPending ? <Spinner className="size-4" /> : <UserX className="size-4" />}
                <span>Deactivate User</span>
              </Button>
            ) : null}
            {selectedRoleUser && !selectedRoleUser.isActive ? (
              <Button
                type="button"
                onClick={handleReactivateUser}
                className="bg-emerald-500/12 text-emerald-800 hover:bg-emerald-500/18 dark:text-emerald-300"
                disabled={reactivateUserMutation.isPending}
              >
                {reactivateUserMutation.isPending ? <Spinner className="size-4" /> : <Check className="size-4" />}
                <span>Reactivate User</span>
              </Button>
            ) : null}
          </div>

          {selectedRoleUser ? (
            <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground md:col-span-3">
              <span className="font-medium text-foreground">{selectedRoleUser.name}</span>
              <span> currently has the </span>
              <span className="font-medium text-foreground">{roleLabels[selectedRoleUser.role]}</span>
              <span> role.</span>
              <span> Status: </span>
              <span className="font-medium text-foreground">{selectedRoleUser.isActive ? "Active" : "Inactive"}</span>
              {selectedRoleUser.id === appUser?.id ? <span> You cannot change your own role.</span> : null}
              {selectedRoleUser.id === appUser?.id ? <span> You cannot deactivate your own account.</span> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="size-5" />
            <span>Finalization Rollback</span>
          </CardTitle>
          <CardDescription>
            Only locked months can be rolled back. Once rolled back, editing and month-bound actions become available again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {finalizedMonths.length ? (
            finalizedMonths.map((item) => {
              const locked = isMonthLocked(item);

              return (
                <div key={item.month} className="rounded-xl bg-background px-4 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{formatMonthLabel(item.month)}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-semibold",
                            locked
                              ? "bg-emerald-500/10 text-emerald-700"
                              : item.rolledBackAt
                                ? "bg-amber-500/10 text-amber-700"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {getMonthStatusLabel(item)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.finalizedAt ? `Finalized on ${formatDate(item.finalizedAt)}` : "Finalization date unavailable"}
                      </p>
                      {item.rolledBackAt ? (
                        <p className="text-sm text-muted-foreground">
                          Rolled back on {formatDate(item.rolledBackAt)}
                          {item.rolledBackById
                            ? ` by ${usersById.get(item.rolledBackById)?.name ?? "Unknown user"}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => rollbackMonthMutation.mutate(item.month)}
                      disabled={!locked || rollbackMonthMutation.isPending}
                    >
                      {rollbackMonthMutation.isPending ? <Spinner className="size-4" /> : <RotateCcw className="size-4" />}
                      <span>{locked ? "Rollback" : "Already unlocked"}</span>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-center text-sm text-muted-foreground">
              No finalized months are available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminActionsPage() {
  return (
    <RoleProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminActionsPageContent />
    </RoleProtectedRoute>
  );
}
