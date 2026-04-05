'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Clock3, Edit3, Minus, Plus, Save, Settings2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createMealDeadline, getMealDeadlines, updateMealDeadline } from "@/lib/api/deadlines";
import { getWeeklyMealTemplates, updateWeeklyMealTemplate } from "@/lib/api/templates";
import { getUsers, updateUserRole } from "@/lib/api/users";
import { queryKeys } from "@/lib/query/keys";
import type { AppUser, UserRole } from "@/lib/types/app-user";
import type { DayOfWeek, MealType } from "@/lib/types/meal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const mealTypeOptions: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};
const dayOfWeekOrder: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const defaultDeadlineEditors: Record<MealType, { time: string; offsetDays: string }> = {
  BREAKFAST: { time: "22:00", offsetDays: "-1" },
  LUNCH: { time: "09:00", offsetDays: "0" },
  DINNER: { time: "15:00", offsetDays: "0" },
};
const defaultTemplateMeals: Record<DayOfWeek, MealType[]> = {
  SUNDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  MONDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  TUESDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  WEDNESDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  THURSDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  FRIDAY: ["LUNCH", "DINNER"],
  SATURDAY: ["BREAKFAST", "LUNCH", "DINNER"],
};

type DeadlineEditorState = {
  time: string;
  offsetDays: string;
};

const roleOptions: UserRole[] = ["MEMBER", "MANAGER", "ADMIN"];
const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

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
                    {user.email} • {roleLabels[user.role]}
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

const ConfigurationPage = () => {
  const queryClient = useQueryClient();
  const { appUser, refreshAppUser } = useAuth();
  const isAdmin = appUser?.role === "ADMIN";
  const [activeDeadlineTab, setActiveDeadlineTab] = useState<MealType>("BREAKFAST");
  const [deadlineEditors, setDeadlineEditors] = useState<Partial<Record<MealType, DeadlineEditorState>>>({});
  const [templateEditors, setTemplateEditors] = useState<Partial<Record<DayOfWeek, MealType[]>>>({});
  const [isEditingTemplates, setIsEditingTemplates] = useState(false);
  const [selectedRoleUserId, setSelectedRoleUserId] = useState("");
  const [roleDraft, setRoleDraft] = useState<UserRole>("MEMBER");

  const deadlinesQuery = useQuery({
    queryKey: queryKeys.mealDeadlines,
    queryFn: getMealDeadlines,
  });
  const templatesQuery = useQuery({
    queryKey: ["weekly-meal-templates"],
    queryFn: getWeeklyMealTemplates,
  });
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getUsers,
    enabled: isAdmin,
  });

  const users = (usersQuery.data ?? [])
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name) || left.email.localeCompare(right.email));
  const selectedRoleUser = users.find((user) => user.id === selectedRoleUserId) ?? null;

  const saveDeadlineMutation = useMutation({
    mutationFn: async ({
      mealType,
      time,
      offsetDays,
      exists,
    }: {
      mealType: MealType;
      time: string;
      offsetDays: number;
      exists: boolean;
    }) => {
      if (exists) {
        return updateMealDeadline(mealType, { time, offsetDays });
      }

      return createMealDeadline({ type: mealType, time, offsetDays });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealDeadlines });
      toast.success("Deadline saved.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save deadline.");
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (payloads: Parameters<typeof updateWeeklyMealTemplate>[0][]) => {
      await Promise.all(payloads.map((payload) => updateWeeklyMealTemplate(payload)));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["weekly-meal-templates"] });
      setTemplateEditors({});
      setIsEditingTemplates(false);
      toast.success("Meal template saved.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save meal template.");
    },
  });
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => updateUserRole(userId, role),
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });

      if (updatedUser.id === appUser?.id) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
        await refreshAppUser();
      }

      setSelectedRoleUserId(updatedUser.id);
      setRoleDraft(updatedUser.role);
      toast.success(`Role updated to ${roleLabels[updatedUser.role]}.`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update user role.");
    },
  });

  if (deadlinesQuery.isPending || templatesQuery.isPending) {
    return <LoadingState label="Loading configuration..." />;
  }

  if (deadlinesQuery.isError || templatesQuery.isError) {
    return <LoadingState label="We couldn't load the configuration." />;
  }

  const deadlineByType = new Map((deadlinesQuery.data ?? []).map((deadline) => [deadline.type, deadline]));
  const templateByDay = new Map((templatesQuery.data ?? []).map((template) => [template.dayOfWeek, template]));

  const handleDeadlineChange = <K extends keyof DeadlineEditorState>(
    mealType: MealType,
    field: K,
    value: DeadlineEditorState[K]
  ) => {
    setDeadlineEditors((current) => ({
      ...current,
      [mealType]: {
        ...(current[mealType] ?? {
          time: deadlineByType.get(mealType)?.time ?? defaultDeadlineEditors[mealType].time,
          offsetDays: deadlineByType.get(mealType)
            ? String(deadlineByType.get(mealType)?.offsetDays)
            : defaultDeadlineEditors[mealType].offsetDays,
        }),
        [field]: value,
      },
    }));
  };

  const handleSaveDeadline = async (mealType: MealType) => {
    const currentDeadline = deadlineByType.get(mealType);
    const draft = deadlineEditors[mealType] ?? {
      time: currentDeadline?.time ?? defaultDeadlineEditors[mealType].time,
      offsetDays: currentDeadline
        ? String(currentDeadline.offsetDays)
        : defaultDeadlineEditors[mealType].offsetDays,
    };
    const offsetDays = Number(draft.offsetDays);

    if (!draft.time) {
      toast.error("Deadline time is required.");
      return;
    }

    if (!Number.isInteger(offsetDays)) {
      toast.error("Offset days must be a whole number.");
      return;
    }

    await saveDeadlineMutation.mutateAsync({
      mealType,
      time: draft.time,
      offsetDays,
      exists: Boolean(currentDeadline),
    });
  };

  const handleOffsetDaysStep = (mealType: MealType, direction: "increment" | "decrement") => {
    const currentDeadline = deadlineByType.get(mealType);
    const draft = deadlineEditors[mealType] ?? {
      time: currentDeadline?.time ?? defaultDeadlineEditors[mealType].time,
      offsetDays: currentDeadline
        ? String(currentDeadline.offsetDays)
        : defaultDeadlineEditors[mealType].offsetDays,
    };
    const nextOffsetDays =
      (Number.parseInt(draft.offsetDays || "0", 10) || 0) +
      (direction === "increment" ? 1 : -1);

    handleDeadlineChange(mealType, "offsetDays", String(nextOffsetDays));
  };

  const handleTemplateToggle = (dayOfWeek: DayOfWeek, mealType: MealType) => {
    if (!isEditingTemplates) {
      return;
    }

    setTemplateEditors((current) => {
      const baseMeals =
        current[dayOfWeek] ??
        templateByDay.get(dayOfWeek)?.meals ??
        defaultTemplateMeals[dayOfWeek];
      const hasMeal = baseMeals.includes(mealType);
      const nextMeals = hasMeal
        ? baseMeals.filter((meal) => meal !== mealType)
        : [...baseMeals, mealType];

      return {
        ...current,
        [dayOfWeek]: mealTypeOptions.filter((meal) => nextMeals.includes(meal)),
      };
    });
  };

  const handleSaveTemplates = async () => {
    const payloads = dayOfWeekOrder.map((dayOfWeek) => ({
      dayOfWeek,
      meals:
        templateEditors[dayOfWeek] ??
        templateByDay.get(dayOfWeek)?.meals ??
        defaultTemplateMeals[dayOfWeek],
    }));

    await saveTemplateMutation.mutateAsync(payloads);
  };

  const handleRoleUserChange = (userId: string) => {
    setSelectedRoleUserId(userId);

    const selectedUser = users.find((user) => user.id === userId);
    setRoleDraft(selectedUser?.role ?? "MEMBER");
  };

  const handleRoleSave = async () => {
    if (!selectedRoleUser) {
      toast.error("Select a user first.");
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageIntro
        eyebrow="Manager"
        title="Configuration"
        description="Manage universal meal deadlines and the weekly meal template used to generate future schedules."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="size-5" />
              <span>Universal Meal Deadlines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeDeadlineTab} onValueChange={(value) => setActiveDeadlineTab(value as MealType)}>
              <TabsList>
                {mealTypeOptions.map((mealType) => (
                  <TabsTrigger key={mealType} value={mealType}>
                    {mealTypeLabels[mealType]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {mealTypeOptions.map((mealType) => {
                const deadline = deadlineByType.get(mealType);
                const editor = deadlineEditors[mealType] ?? {
                  time: deadline?.time ?? defaultDeadlineEditors[mealType].time,
                  offsetDays: deadline ? String(deadline.offsetDays) : defaultDeadlineEditors[mealType].offsetDays,
                };

                return (
                  <TabsContent key={mealType} value={mealType}>
                    <div className="rounded-[calc(var(--radius)+0.25rem)] bg-muted p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{mealTypeLabels[mealType]}</p>
                        </div>
                        <Button type="button" onClick={() => handleSaveDeadline(mealType)} disabled={saveDeadlineMutation.isPending}>
                          {saveDeadlineMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                          <span>Save</span>
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`deadline-time-${mealType}`}>Time</Label>
                          <Input id={`deadline-time-${mealType}`} type="time" value={editor.time} onChange={(event) => handleDeadlineChange(mealType, "time", event.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`deadline-offset-${mealType}`}>Offset days</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              aria-label={`Decrease ${mealTypeLabels[mealType]} offset days`}
                              onClick={() => handleOffsetDaysStep(mealType, "decrement")}
                            >
                              <Minus />
                            </Button>
                            <Input
                              id={`deadline-offset-${mealType}`}
                              type="number"
                              step="1"
                              value={editor.offsetDays}
                              onChange={(event) => handleDeadlineChange(mealType, "offsetDays", event.target.value)}
                              className="text-center"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              aria-label={`Increase ${mealTypeLabels[mealType]} offset days`}
                              onClick={() => handleOffsetDaysStep(mealType, "increment")}
                            >
                              <Plus />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-5" />
              <span>Weekly Meal Template</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 justify-between">
              <p>
                Choose which meals should exist on each weekday when generating future schedules.
              </p>
              {isEditingTemplates ? (
                <Button type="button" onClick={handleSaveTemplates} disabled={saveTemplateMutation.isPending}>
                  {saveTemplateMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                  <span>Save</span>
                </Button>
              ) : (
                <Button type="button" onClick={() => setIsEditingTemplates(true)}>
                  <Edit3 />
                  <span>Edit</span>
                </Button>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex justify-end">
            </div>
            {dayOfWeekOrder.map((dayOfWeek) => {
              const template = templateByDay.get(dayOfWeek);
              const selectedMeals = templateEditors[dayOfWeek] ?? template?.meals ?? defaultTemplateMeals[dayOfWeek];

              return (
                <div key={dayOfWeek} className="rounded-[calc(var(--radius)+0.05rem)] bg-card flex items-center justify-between gap-4 p-4">
                  <div>
                    <div>
                      <p className="font-semibold text-foreground">{dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {mealTypeOptions.map((mealType) => (
                      <label key={mealType} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={selectedMeals.includes(mealType)}
                          onChange={() => handleTemplateToggle(dayOfWeek, mealType)}
                          disabled={!isEditingTemplates || saveTemplateMutation.isPending}
                        />
                        <span>{mealTypeLabels[mealType]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              <span>Role Assignment</span>
            </CardTitle>
            <CardDescription>
              Select a user, choose a new role, and save. Managers can view this page but cannot change roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_auto]">
            <div className="space-y-2">
              <Label>Select user</Label>
              {usersQuery.isPending ? (
                <div className="flex h-10 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">
                  Loading users...
                </div>
              ) : usersQuery.isError ? (
                <div className="flex h-10 items-center rounded-md border border-destructive/30 px-3 text-sm text-destructive">
                  Couldn&apos;t load users.
                </div>
              ) : users.length ? (
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

            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleRoleSave}
                disabled={!selectedRoleUser || updateUserRoleMutation.isPending || selectedRoleUser.role === roleDraft}
              >
                {updateUserRoleMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                <span>Save role</span>
              </Button>
            </div>

            {selectedRoleUser ? (
              <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground md:col-span-3">
                <span className="font-medium text-foreground">{selectedRoleUser.name}</span>
                <span> currently has the </span>
                <span className="font-medium text-foreground">{roleLabels[selectedRoleUser.role]}</span>
                <span> role.</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ConfigurationPage;
