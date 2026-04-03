'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Info,
  Soup,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  createRegistration,
  deleteRegistration,
  getRegistrations,
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

const mealTypeOrder: Record<MealType, number> = {
  BREAKFAST: 0,
  LUNCH: 1,
  DINNER: 2,
};

const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

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
const getCurrentYear = () => getDhakaToday().slice(0, 4);

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
  const upcomingSchedulesQuery = useQuery({
    queryKey: queryKeys.upcomingSchedules([selectedMonth]),
    queryFn: () => getSchedules({ month: selectedMonth }),
    enabled: Boolean(user),
  });

  const registrationsQuery = useQuery({
    queryKey: queryKeys.myRegistrations,
    queryFn: () => getRegistrations(),
    enabled: Boolean(user),
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

  if (upcomingSchedulesQuery.isPending || registrationsQuery.isPending) {
    return <LoadingState label="Loading your upcoming meals..." />;
  }

  if (upcomingSchedulesQuery.isError || registrationsQuery.isError) {
    const errorMessage =
      (upcomingSchedulesQuery.error instanceof Error && upcomingSchedulesQuery.error.message) ||
      (registrationsQuery.error instanceof Error && registrationsQuery.error.message) ||
      "We couldn't load your meal dashboard.";

    return <LoadingState label={errorMessage} />;
  }

  const registrations = registrationsQuery.data ?? [];
  const selectedYear = selectedMonth.slice(0, 4);
  const selectedMonthValue = selectedMonth.slice(5, 7);
  const yearOptions = Array.from({ length: 5 }, (_, index) =>
    String(Number(getCurrentYear()) - 2 + index)
  );
  const selectedMonthSchedules = (upcomingSchedulesQuery.data ?? [])
    .filter((schedule) => getDateKey(schedule.date).slice(0, 7) === selectedMonth)
    .sort((left, right) => getDateKey(left.date).localeCompare(getDateKey(right.date)))
    .filter((schedule) => schedule.meals.length > 0);

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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <PageIntro
        eyebrow="Member Area"
        title="Monthly meal bookings"
        description="Pick a month to browse each scheduled day and manage your breakfast, lunch, and dinner bookings."
      />

      <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Select month
            </p>
            <div className="grid max-w-xs gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              <Select
                value={selectedMonthValue}
                onValueChange={(value) => setSelectedMonth(`${selectedYear}-${value}`)}
              >
                <SelectTrigger aria-label="Select month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear}
                onValueChange={(value) => setSelectedMonth(`${value}-${selectedMonthValue}`)}
              >
                <SelectTrigger aria-label="Select year">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Month at a glance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
              <div className="rounded-[calc(var(--radius-field)+0.25rem)] border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Bookings
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {totalMonthBookings}
                </p>
              </div>
              <div className="rounded-[calc(var(--radius-field)+0.25rem)] border bg-muted/40 p-4">
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

        <div className="grid gap-5">
          {selectedMonthSchedules.length ? (
            selectedMonthSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                registrationByMealId={registrationByMealId}
                pendingMealId={pendingMealId}
                onRegister={handleRegister}
                onCancel={handleCancel}
              />
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No schedules for this month</CardTitle>
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
};

const ScheduleCard = ({
  schedule,
  registrationByMealId,
  pendingMealId,
  onRegister,
  onCancel,
}: ScheduleCardProps) => {
  const meals = [...schedule.meals].sort(
    (left, right) => mealTypeOrder[left.type] - mealTypeOrder[right.type]
  );

  return (
    <Card className="w-full md:w-[24rem]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3">
              <CalendarDays className="size-5" />
              <span>{formatDateLabel(schedule.date)}</span>
            </CardTitle>
            <CardDescription>
              {meals.length} available meal option{meals.length === 1 ? "" : "s"} for this day.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {meals.map((meal) => {
          const registration = registrationByMealId.get(meal.id);
          const deadlinePassed = isMealDeadlinePassed(meal.deadline);
          const isUnavailable = !meal.isAvailable;
          const isBusy = pendingMealId === meal.id;

          return (
            <MealRow
              key={meal.id}
              meal={meal}
              registration={registration}
              deadlinePassed={deadlinePassed}
              isUnavailable={isUnavailable}
              isBusy={isBusy}
              onRegister={onRegister}
              onCancel={onCancel}
            />
          );
        })}
      </CardContent>
    </Card>
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
};

const MealRow = ({
  meal,
  registration,
  deadlinePassed,
  isUnavailable,
  isBusy,
  onRegister,
  onCancel,
}: MealRowProps) => {
  const statusLabel = registration
    ? `Booked${registration.count > 1 ? ` x${registration.count}` : ""}`
    : null;

  return (
    <div className="flex h-full w-full flex-col rounded-[calc(var(--radius)+0.25rem)] border bg-card p-4">
      <div className="flex min-h-24 flex-1 flex-col justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border bg-muted/40">
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
          {statusLabel ? (
            <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-success-foreground">
              {statusLabel}
            </span>
          ) : null}
        </div>

        <div className="min-h-12 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
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
            {isBusy ? <Spinner className="size-4" /> : <Trash2 />}
            <span>Cancel booking</span>
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
