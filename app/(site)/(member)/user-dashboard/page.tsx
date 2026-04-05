'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Info,
  Minus,
  Plus,
  Soup,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  createRegistration,
  deleteRegistration,
  getRegistrations,
  updateRegistration,
} from "@/lib/api/registrations";
import { getSchedules } from "@/lib/api/schedules";
import { queryKeys } from "@/lib/query/keys";
import type {
  MealRegistration,
  MealSchedule,
  MealType,
  ScheduledMeal,
} from "@/lib/types/meal";
import { useAuth } from "@/providers/AuthProvider";
import { IoCalculator } from "react-icons/io5";

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

const isMealDeadlinePassed = (deadline: string) => {
  const deadlineTime = Date.parse(deadline);

  if (Number.isNaN(deadlineTime)) {
    return false;
  }

  return Date.now() > deadlineTime;
};

const UserDashboardPage = () => {
  const queryClient = useQueryClient();
  const { appUser, user } = useAuth();
  const [pendingMealId, setPendingMealId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [selectedDateKey, setSelectedDateKey] = useState(getDhakaToday);
  const upcomingSchedulesQuery = useQuery({
    queryKey: queryKeys.upcomingSchedules([selectedMonth]),
    queryFn: () => getSchedules({ month: selectedMonth }),
    enabled: Boolean(user),
  });

  const registrationsQuery = useQuery({
    queryKey: [...queryKeys.myRegistrations, appUser?.id ?? "anonymous"],
    queryFn: () => getRegistrations(appUser?.id),
    enabled: Boolean(user && appUser?.id),
  });

  const registerMutation = useMutation({
    mutationFn: createRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRegistrations });
      toast.success("Meal booked.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not book the meal.");
    },
    onSettled: () => {
      setPendingMealId(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: deleteRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRegistrations });
      toast.success("Booking cancelled.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not cancel the booking.");
    },
    onSettled: () => {
      setPendingMealId(null);
    },
  });

  const updateCountMutation = useMutation({
    mutationFn: ({
      registrationId,
      count,
    }: {
      registrationId: string;
      count: number;
    }) => updateRegistration(registrationId, { count }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRegistrations });
      toast.success("Meal count updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update the meal count.");
    },
    onSettled: () => {
      setPendingMealId(null);
    },
  });

  if (upcomingSchedulesQuery.isPending || registrationsQuery.isPending) {
    return <LoadingState label="Loading your dashboard..." />;
  }

  if (upcomingSchedulesQuery.isError || registrationsQuery.isError) {
    const errorMessage =
      (upcomingSchedulesQuery.error instanceof Error && upcomingSchedulesQuery.error.message) ||
      (registrationsQuery.error instanceof Error && registrationsQuery.error.message) ||
      "We couldn't load your meal dashboard.";

    return <LoadingState label={errorMessage} />;
  }

  const registrations = registrationsQuery.data ?? [];
  const selectedMonthSchedules = (upcomingSchedulesQuery.data ?? [])
    .filter((schedule) => getDateKey(schedule.date).slice(0, 7) === selectedMonth)
    .sort((left, right) => getDateKey(left.date).localeCompare(getDateKey(right.date)))
    .filter((schedule) => schedule.meals.length > 0);
  const scheduledDateKeys = new Set(
    selectedMonthSchedules.map((schedule) => getDateKey(schedule.date))
  );
  const fallbackDateKey = getDhakaToday().startsWith(selectedMonth)
    ? getDhakaToday()
    : (selectedMonthSchedules[0]
      ? getDateKey(selectedMonthSchedules[0].date)
      : `${selectedMonth}-01`);
  const effectiveSelectedDateKey =
    selectedDateKey && selectedDateKey.startsWith(selectedMonth)
      ? selectedDateKey
      : fallbackDateKey;
  const selectedSchedule =
    selectedMonthSchedules.find(
      (schedule) => getDateKey(schedule.date) === effectiveSelectedDateKey
    ) ?? null;

  const registrationByMealId = new Map(
    registrations.map((registration) => [registration.scheduledMealId, registration])
  );
  const totalMonthBookings = registrations
    .filter((registration) => {
      const schedule = selectedMonthSchedules.find((entry) =>
        entry.meals.some((meal) => meal.id === registration.scheduledMealId)
      );

      return Boolean(schedule);
    })
    .reduce((total, registration) => total + registration.count, 0);

  const handleRegister = async (scheduledMealId: string) => {
    setPendingMealId(scheduledMealId);
    await registerMutation.mutateAsync({
      scheduledMealId,
      count: 1,
    });
  };

  const handleCancel = async (registrationId: string, scheduledMealId: string) => {
    setPendingMealId(scheduledMealId);
    await cancelMutation.mutateAsync(registrationId);
  };

  const handleUpdateCount = async (
    registrationId: string,
    scheduledMealId: string,
    count: number
  ) => {
    setPendingMealId(scheduledMealId);
    await updateCountMutation.mutateAsync({ registrationId, count });
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-4 px-4">
      <PageIntro
        title="Monthly Meal Bookings"
        description="Pick a month to browse each scheduled day and manage your breakfast, lunch, and dinner bookings."
      />

      <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Select Date
            </p>
          </div>
          <Calendar className="max-w-[60vw] mx-auto p-4 rounded-2xl bg-muted"
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

          <Card>
            <CardHeader>
              <CardTitle>Month At A Glance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  My Bookings
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {totalMonthBookings}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Balance
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {String(appUser?.balance ?? "0")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-2 md:w-[24rem]">
          <p className="text-2xl">Available Meals</p>
          {selectedMonthSchedules.length ? (
            <div className="w-full">
              <div>
                {selectedSchedule ? (
                  <ScheduleCard
                    schedule={selectedSchedule}
                    registrationByMealId={registrationByMealId}
                    pendingMealId={pendingMealId}
                    onRegister={handleRegister}
                    onCancel={handleCancel}
                    onUpdateCount={handleUpdateCount}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    No meal schedule is available for {formatDateLabel(effectiveSelectedDateKey)}.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Schedules For This Month</CardTitle>
                <CardDescription>
                  No meal cards are available for {selectedMonth} yet.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
};

type ScheduleCardProps = {
  schedule: MealSchedule;
  registrationByMealId: Map<string, MealRegistration>;
  pendingMealId: string | null;
  onRegister: (scheduledMealId: string) => Promise<void>;
  onCancel: (registrationId: string, scheduledMealId: string) => Promise<void>;
  onUpdateCount: (
    registrationId: string,
    scheduledMealId: string,
    count: number
  ) => Promise<void>;
};

const ScheduleCard = ({
  schedule,
  registrationByMealId,
  pendingMealId,
  onRegister,
  onCancel,
  onUpdateCount,
}: ScheduleCardProps) => {
  const mealByType = new Map(
    schedule.meals.map((meal) => [meal.type, meal] satisfies [MealType, ScheduledMeal])
  );
  const mealSlots = mealTypeOptions.map((mealType) => mealByType.get(mealType) ?? null);
  const availableMealCount = mealSlots.filter(Boolean).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3">
              <CalendarDays className="size-5" />
              <span>{formatDateLabel(schedule.date)}</span>
            </CardTitle>
            <CardDescription>
              {availableMealCount} available meal option{availableMealCount === 1 ? "" : "s"} for this day.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {mealSlots.map((meal, index) => {
          if (!meal) {
            return (
              <MealPlaceholderCard
                key={`${schedule.id}-${mealTypeOptions[index]}`}
                mealType={mealTypeOptions[index]}
              />
            );
          }

          const registration = registrationByMealId.get(meal.id);
          const deadlinePassed = isMealDeadlinePassed(meal.deadline);
          const isUnavailable = !meal.isAvailable;
          const isBusy = pendingMealId === meal.id;

          return (
            <MealRow
              key={`${meal.id}:${registration?.count ?? 0}`}
              meal={meal}
              registration={registration}
              deadlinePassed={deadlinePassed}
              isUnavailable={isUnavailable}
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
};

const MealPlaceholderCard = ({ mealType }: { mealType: MealType }) => {
  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-dashed bg-muted p-4">
      <div className="flex min-h-24 flex-1 flex-col justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border border-dashed bg-background/70 text-muted-foreground">
            {mealType === "BREAKFAST" ? (
              <Soup className="size-4" />
            ) : (
              <UtensilsCrossed className="size-4" />
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-muted-foreground">
              {mealTypeLabels[mealType]}
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <IoCalculator />
              <span>Not available</span>
            </div>
          </div>
        </div>

        <div className="min-h-12 rounded-md border border-dashed bg-background/70 px-3 py-2 text-sm text-muted-foreground">
          <p>Meal not scheduled</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" variant="outline" disabled className="w-full">
          <Info className="size-4" />
          <span>Not Available</span>
        </Button>
      </div>
    </div>
  );
};

type MealRowProps = {
  meal: ScheduledMeal;
  registration?: MealRegistration;
  deadlinePassed: boolean;
  isUnavailable: boolean;
  isBusy: boolean;
  onRegister: (scheduledMealId: string) => Promise<void>;
  onCancel: (registrationId: string, scheduledMealId: string) => Promise<void>;
  onUpdateCount: (
    registrationId: string,
    scheduledMealId: string,
    count: number
  ) => Promise<void>;
};

const MealRow = ({
  meal,
  registration,
  deadlinePassed,
  isUnavailable,
  isBusy,
  onRegister,
  onCancel,
  onUpdateCount,
}: MealRowProps) => {
  const [countDraft, setCountDraft] = useState(String(registration?.count ?? 1));

  const commitCount = async (nextCount: number) => {
    if (!registration) {
      return;
    }

    const normalizedCount = Math.max(1, Math.floor(nextCount));
    setCountDraft(String(normalizedCount));

    if (normalizedCount === registration.count) {
      return;
    }

    await onUpdateCount(registration.id, meal.id, normalizedCount);
  };

  return (
    <div
      className={`flex h-full w-full flex-col rounded-lg bg-card p-4 ${registration && "ring ring-primary/50"}`}
    >
      <div className="flex min-h-24 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
              {meal.type === "BREAKFAST" ? (
                <Soup className="size-4" />
              ) : (
                <UtensilsCrossed className="size-4" />
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{mealTypeLabels[meal.type]}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <IoCalculator />
                <span>{String(meal.weight)}</span>
              </div>
            </div>
          </div>
          {registration ? (
            <div className="items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void commitCount((registration?.count ?? 1) - 1)}
                disabled={deadlinePassed || isBusy || (registration?.count ?? 1) <= 1}
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
                disabled={deadlinePassed || isBusy}
                className="h-9 w-20 text-center"
                aria-label={`${mealTypeLabels[meal.type]} meal count`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void commitCount((registration?.count ?? 1) + 1)}
                disabled={deadlinePassed || isBusy}
                aria-label={`Increase ${mealTypeLabels[meal.type]} meal count`}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <div className="min-h-12 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <p>{meal.menu || "Menu not specified"}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {registration ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancel(registration.id, meal.id)}
            disabled={deadlinePassed || isBusy}
          >
            {isBusy ? <Spinner className="size-4" /> : <Trash2 className="text-red-500" />}
            <span>Cancel</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => onRegister(meal.id)}
            disabled={isUnavailable || deadlinePassed || isBusy}
          >
            {isBusy ? (
              <Spinner className="size-4" />
            ) : deadlinePassed ? (
              <Info className="size-4" />
            ) : (
              <Check />
            )}
            <span>{deadlinePassed ? "Deadline Passed" : "Register"}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;
