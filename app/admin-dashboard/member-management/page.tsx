'use client'

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronsUpDown,
  Minus,
  Plus,
  Soup,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  createRegistration,
  deleteRegistration,
  getRegistrations,
  updateRegistration,
} from "@/lib/api/registrations";
import { getSchedules } from "@/lib/api/schedules";
import { getUsers } from "@/lib/api/users";
import type { AppUser } from "@/lib/types/app-user";
import type { MealRegistration, MealSchedule, MealType, ScheduledMeal } from "@/lib/types/meal";
import { cn } from "@/lib/utils";

const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

const mealTypeOptions: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "Asia/Dhaka",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

const deadlineFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

const parseScheduleDate = (dateString: string) => {
  if (!dateString) {
    return null;
  }

  const normalizedDate = dateString.includes("T") ? dateString.slice(0, 10) : dateString;
  const match = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    const fallbackDate = new Date(dateString);
    return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
  }

  const [, year, month, day] = match;
  const parsedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDateLabel = (dateString: string) => {
  const date = parseScheduleDate(dateString);

  if (!date) {
    return dateString || "Unknown date";
  }

  return `${weekdayFormatter.format(date)}, ${dateFormatter.format(date)}`;
};

const getDateKey = (dateString: string) => {
  const date = parseScheduleDate(dateString);

  if (!date) {
    return dateString.includes("T") ? dateString.slice(0, 10) : dateString;
  }

  return date.toISOString().slice(0, 10);
};

const getDhakaDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "0000",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
  };
};

const getDhakaToday = () => {
  const today = getDhakaDateParts();
  return `${today.year}-${today.month}-${today.day}`;
};

const getCurrentMonth = () => getDhakaToday().slice(0, 7);

const monthKeyToDate = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

const dateKeyToDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const dateToDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDeadline = (deadline: string) => {
  const parsed = new Date(deadline);

  if (Number.isNaN(parsed.getTime())) {
    return "Deadline unavailable";
  }

  return deadlineFormatter.format(parsed);
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA";

function MemberPicker({
  value,
  members,
  onChange,
  placeholder = "Select member",
}: {
  value: string;
  members: AppUser[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMembers = members.filter((member) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      member.name.toLowerCase().includes(normalizedSearch) ||
      member.email.toLowerCase().includes(normalizedSearch) ||
      (member.mobile ?? "").toLowerCase().includes(normalizedSearch)
    );
  });

  const selectedMember = members.find((member) => member.id === value) ?? null;

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
          <span className={cn("truncate", !selectedMember && "text-muted-foreground")}>
            {selectedMember ? `${selectedMember.name}` : placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="border-b p-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member..."
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredMembers.length ? (
            filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                className="focus:bg-accent focus:text-accent-foreground flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-accent"
                onClick={() => {
                  onChange(member.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{member.name}</span>
                </span>
                <Check className={cn("size-4 shrink-0", member.id === value ? "opacity-100" : "opacity-0")} />
              </button>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">No member found.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function MemberManagementPage() {
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [selectedDateKey, setSelectedDateKey] = useState(getDhakaToday);
  const [pendingMealId, setPendingMealId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getUsers,
  });

  const schedulesQuery = useQuery({
    queryKey: ["admin-schedules", selectedMonth],
    queryFn: () => getSchedules({ month: selectedMonth }),
  });

  const members = (usersQuery.data ?? [])
    .filter((user) => user.role === "MEMBER")
    .sort((left, right) => left.name.localeCompare(right.name));

  const effectiveSelectedMemberId = members.some((member) => member.id === selectedMemberId)
    ? selectedMemberId
    : (members[0]?.id ?? "");
  const selectedMember = members.find((member) => member.id === effectiveSelectedMemberId) ?? null;

  const registrationsQuery = useQuery({
    queryKey: ["member-registrations", effectiveSelectedMemberId],
    queryFn: () => getRegistrations(effectiveSelectedMemberId),
    enabled: Boolean(effectiveSelectedMemberId),
  });

  const refreshSelectedMemberRegistrations = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["member-registrations", effectiveSelectedMemberId],
    });
  };

  const createRegistrationMutation = useMutation({
    mutationFn: createRegistration,
    onSuccess: async () => {
      await refreshSelectedMemberRegistrations();
      toast.success("Member registration added.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not add the registration.");
    },
    onSettled: () => {
      setPendingMealId(null);
    },
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: ({
      registrationId,
      count,
    }: {
      registrationId: string;
      count: number;
    }) => updateRegistration(registrationId, { count }),
    onSuccess: async () => {
      await refreshSelectedMemberRegistrations();
      toast.success("Meal count updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update the meal count.");
    },
    onSettled: () => {
      setPendingMealId(null);
    },
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: deleteRegistration,
    onSuccess: async () => {
      await refreshSelectedMemberRegistrations();
      toast.success("Registration removed.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not remove the registration.");
    },
    onSettled: () => {
      setPendingMealId(null);
    },
  });

  if (
    usersQuery.isPending ||
    schedulesQuery.isPending ||
    (effectiveSelectedMemberId ? registrationsQuery.isPending : false)
  ) {
    return <LoadingState label="Loading member meal overrides..." />;
  }

  if (
    usersQuery.isError ||
    schedulesQuery.isError ||
    (effectiveSelectedMemberId ? registrationsQuery.isError : false)
  ) {
    const errorMessage =
      (usersQuery.error instanceof Error && usersQuery.error.message) ||
      (schedulesQuery.error instanceof Error && schedulesQuery.error.message) ||
      (registrationsQuery.error instanceof Error && registrationsQuery.error.message) ||
      "We couldn't load the member override data.";

    return <LoadingState label={errorMessage} />;
  }

  const selectedMonthSchedules = (schedulesQuery.data ?? [])
    .filter((schedule) => getDateKey(schedule.date).slice(0, 7) === selectedMonth)
    .sort((left, right) => getDateKey(left.date).localeCompare(getDateKey(right.date)))
    .filter((schedule) => schedule.meals.length > 0);

  const scheduledDateKeys = new Set(selectedMonthSchedules.map((schedule) => getDateKey(schedule.date)));
  const fallbackDateKey = getDhakaToday().startsWith(selectedMonth)
    ? getDhakaToday()
    : (selectedMonthSchedules[0]
      ? getDateKey(selectedMonthSchedules[0].date)
      : `${selectedMonth}-01`);
  const effectiveSelectedDateKey =
    selectedDateKey && selectedDateKey.startsWith(selectedMonth) ? selectedDateKey : fallbackDateKey;
  const selectedSchedule =
    selectedMonthSchedules.find((schedule) => getDateKey(schedule.date) === effectiveSelectedDateKey) ?? null;

  const registrations = registrationsQuery.data ?? [];
  const registrationByMealId = new Map(
    registrations.map((registration) => [registration.scheduledMealId, registration] as const)
  );

  const handleRegister = async (scheduledMealId: string) => {
    if (!effectiveSelectedMemberId) {
      toast.error("Select a member first.");
      return;
    }

    setPendingMealId(scheduledMealId);
    await createRegistrationMutation.mutateAsync({
      scheduledMealId,
      count: 1,
      userId: effectiveSelectedMemberId,
    });
  };

  const handleCancel = async (registrationId: string, scheduledMealId: string) => {
    setPendingMealId(scheduledMealId);
    await deleteRegistrationMutation.mutateAsync(registrationId);
  };

  const handleUpdateCount = async (
    registrationId: string,
    scheduledMealId: string,
    count: number
  ) => {
    setPendingMealId(scheduledMealId);
    await updateRegistrationMutation.mutateAsync({ registrationId, count });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageIntro
        eyebrow="Admin"
        title="Meal Overrides"
        description="Managers can select a member, browse scheduled dates, and directly add, update, or remove that member's meal registrations."
      />

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div>
          <Card className="bg-card w-100 mx-auto">
            <CardHeader>
              <div>
                <CardTitle>Select Member</CardTitle>
                <CardDescription>Choose the member whose registrations you want to override.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {members.length ? (
                <>
                  <MemberPicker
                    value={effectiveSelectedMemberId}
                    members={members}
                    onChange={setSelectedMemberId}
                    placeholder="Search and select member"
                  />
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
                  No members are available to manage.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>Choose a month and a scheduled day before editing that member&apos;s meal count.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                className="w-full max-w-120 mx-auto rounded-2xl bg-background p-4"
                mode="single"
                month={monthKeyToDate(selectedMonth)}
                captionLayout="dropdown"
                selected={dateKeyToDate(effectiveSelectedDateKey)}
                onMonthChange={(date) => {
                  setSelectedMonth(dateToDateKey(date).slice(0, 7));
                }}
                onSelect={(date) => {
                  if (date) {
                    const nextDateKey = dateToDateKey(date);
                    setSelectedMonth(nextDateKey.slice(0, 7));
                    setSelectedDateKey(nextDateKey);
                  }
                }}
                modifiers={{
                  scheduled: (date) => scheduledDateKeys.has(dateToDateKey(date)),
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 w-full md:w-fit min-w-120 mx-auto">
          {selectedMonthSchedules.length ? (
            selectedSchedule ? (
              <ScheduleOverrideCard
                member={selectedMember}
                schedule={selectedSchedule}
                registrationByMealId={registrationByMealId}
                pendingMealId={pendingMealId}
                onRegister={handleRegister}
                onCancel={handleCancel}
                onUpdateCount={handleUpdateCount}
              />
            ) : (
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>No Schedule On This Date</CardTitle>
                  <CardDescription>
                    There is no meal schedule for {formatDateLabel(effectiveSelectedDateKey)}.
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          ) : (
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>No Schedules For This Month</CardTitle>
                <CardDescription>No meal schedule exists for {selectedMonth}.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleOverrideCard({
  member,
  schedule,
  registrationByMealId,
  pendingMealId,
  onRegister,
  onCancel,
  onUpdateCount,
}: {
  member: AppUser | null;
  schedule: MealSchedule;
  registrationByMealId: Map<string, MealRegistration>;
  pendingMealId: string | null;
  onRegister: (scheduledMealId: string) => Promise<void>;
  onCancel: (registrationId: string, scheduledMealId: string) => Promise<void>;
  onUpdateCount: (registrationId: string, scheduledMealId: string, count: number) => Promise<void>;
}) {
  const mealByType = new Map(
    schedule.meals.map((meal) => [meal.type, meal] satisfies [MealType, ScheduledMeal])
  );

  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-5" />
          <span>{formatDateLabel(schedule.date)}</span>
        </CardTitle>
        <CardDescription>
          {member ? (
            <>
              Override {member.name}&rsquo;s meal registrations for this schedule.
            </>
          ) : (
            "Select a member to manage this schedule."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {mealTypeOptions.map((mealType) => {
          const meal = mealByType.get(mealType) ?? null;

          if (!meal) {
            return <MealPlaceholderCard key={`${schedule.id}-${mealType}`} mealType={mealType} />;
          }

          const registration = registrationByMealId.get(meal.id);
          const isBusy = pendingMealId === meal.id;

          return (
            <MealOverrideRow
              key={`${meal.id}:${registration?.count ?? 0}`}
              meal={meal}
              registration={registration}
              isBusy={isBusy}
              onRegister={onRegister}
              onCancel={onCancel}
              onUpdateCount={onUpdateCount}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function MealPlaceholderCard({ mealType }: { mealType: MealType }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full border border-dashed bg-muted text-muted-foreground">
          {mealType === "BREAKFAST" ? <Soup className="size-4" /> : <UtensilsCrossed className="size-4" />}
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">{mealTypeLabels[mealType]}</p>
          <p className="text-sm text-muted-foreground">Meal not scheduled for this date.</p>
        </div>
      </div>
    </div>
  );
}

function MealOverrideRow({
  meal,
  registration,
  isBusy,
  onRegister,
  onCancel,
  onUpdateCount,
}: {
  meal: ScheduledMeal;
  registration?: MealRegistration;
  isBusy: boolean;
  onRegister: (scheduledMealId: string) => Promise<void>;
  onCancel: (registrationId: string, scheduledMealId: string) => Promise<void>;
  onUpdateCount: (registrationId: string, scheduledMealId: string, count: number) => Promise<void>;
}) {
  const [countDraft, setCountDraft] = useState(String(registration?.count ?? 1));

  const commitCount = async (nextCount: number) => {
    if (!registration) {
      return;
    }

    const normalizedCount = Math.max(1, Math.floor(nextCount || 1));
    setCountDraft(String(normalizedCount));

    if (normalizedCount === registration.count) {
      return;
    }

    await onUpdateCount(registration.id, meal.id, normalizedCount);
  };

  return (
    <div className={cn("rounded-2xl bg-background p-4", registration && "ring-1 ring-primary/50")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
              {meal.type === "BREAKFAST" ? <Soup className="size-4" /> : <UtensilsCrossed className="size-4" />}
            </div>
            <div>
              <p className="font-semibold text-foreground">{mealTypeLabels[meal.type]}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{String(meal.weight)} unit</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-muted px-3 py-3 text-sm text-muted-foreground">
            <p>{meal.menu || "Menu not specified."}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:items-end">
          {registration ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => void commitCount((registration.count ?? 1) - 1)}
                  disabled={isBusy || registration.count <= 1}
                  aria-label={`Decrease ${mealTypeLabels[meal.type]} meal count`}
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  min="1"
                  value={countDraft}
                  onChange={(event) => setCountDraft(event.target.value)}
                  onBlur={() => void commitCount(Number(countDraft))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  disabled={isBusy}
                  className="h-9 w-20 text-center"
                  aria-label={`${mealTypeLabels[meal.type]} meal count`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => void commitCount((registration.count ?? 1) + 1)}
                  disabled={isBusy}
                  aria-label={`Increase ${mealTypeLabels[meal.type]} meal count`}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Registered: {registration.count}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void onCancel(registration.id, meal.id)}
                  disabled={isBusy}
                >
                  {isBusy ? <Spinner className="size-4" /> : <Trash2 className="size-4 text-red-500" />}
                  <span>Remove</span>
                </Button>
              </div>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => void onRegister(meal.id)}
              disabled={isBusy}
            >
              {isBusy ? (
                <Spinner className="size-4" />
              ) : (
                <Check className="size-4" />
              )}
              <span>Add registration</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
