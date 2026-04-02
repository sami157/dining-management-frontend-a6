'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Clock3,
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getMealDeadlines } from "@/lib/api/deadlines";
import {
  createRegistration,
  deleteRegistration,
  getRegistrations,
} from "@/lib/api/registrations";
import { getSchedules } from "@/lib/api/schedules";
import { queryKeys } from "@/lib/query/keys";
import type {
  MealDeadline,
  MealRegistration,
  MealSchedule,
  MealType,
  ScheduledMeal,
} from "@/lib/types/meal";
import { useAuth } from "@/providers/AuthProvider";

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

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
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

const formatDeadlineLabel = (scheduleDate: string, deadline?: MealDeadline) => {
  if (!deadline) {
    return "No deadline configured";
  }

  const deadlineDate = addDaysToDateString(scheduleDate, deadline.offsetDays);
  const [hours, minutes] = deadline.time.split(":").map(Number);
  const deadlineInstant = new Date(
    Date.UTC(
      Number(deadlineDate.slice(0, 4)),
      Number(deadlineDate.slice(5, 7)) - 1,
      Number(deadlineDate.slice(8, 10)),
      hours - 6,
      minutes
    )
  );

  return `${formatDateLabel(deadlineDate)} at ${timeFormatter.format(deadlineInstant)} (Dhaka)`;
};

const getDhakaNowParts = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date());

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "0000",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    hour: parts.find((part) => part.type === "hour")?.value ?? "00",
    minute: parts.find((part) => part.type === "minute")?.value ?? "00",
  };
};

const getDhakaToday = () => {
  const now = getDhakaNowParts();

  return `${now.year}-${now.month}-${now.day}`;
};

const getDhakaNowStamp = () => {
  const now = getDhakaNowParts();

  return `${now.year}-${now.month}-${now.day}T${now.hour}:${now.minute}:00`;
};

const addDaysToDateString = (dateString: string, offsetDays: number) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + offsetDays));

  return utcDate.toISOString().slice(0, 10);
};

const getMonthKey = (dateString: string) => dateString.slice(0, 7);

const getUpcomingMonthKeys = () => {
  const today = getDhakaToday();
  const nextWeek = addDaysToDateString(today, 7);
  const monthKeys = [getMonthKey(today), getMonthKey(nextWeek)];

  return [...new Set(monthKeys)];
};

const getDeadlineStamp = (scheduleDate: string, deadline?: MealDeadline) => {
  if (!deadline) {
    return null;
  }

  const deadlineDate = addDaysToDateString(scheduleDate, deadline.offsetDays);

  return `${deadlineDate}T${deadline.time}:00`;
};

const isDeadlinePassed = (scheduleDate: string, deadline: MealDeadline | undefined) => {
  const deadlineStamp = getDeadlineStamp(scheduleDate, deadline);

  if (!deadlineStamp) {
    return false;
  }

  return getDhakaNowStamp() > deadlineStamp;
};

const UserDashboardPage = () => {
  const queryClient = useQueryClient();
  const { appUser, user } = useAuth();
  const [pendingMealId, setPendingMealId] = useState<string | null>(null);
  const upcomingMonthKeys = getUpcomingMonthKeys();
  const upcomingSchedulesQuery = useQuery({
    queryKey: queryKeys.upcomingSchedules(upcomingMonthKeys),
    queryFn: async () => {
      const scheduleGroups = await Promise.all(
        upcomingMonthKeys.map((month) => getSchedules({ month }))
      );

      return scheduleGroups.flat();
    },
    enabled: Boolean(user),
  });

  const registrationsQuery = useQuery({
    queryKey: queryKeys.myRegistrations,
    queryFn: () => getRegistrations(),
    enabled: Boolean(user),
  });

  const deadlinesQuery = useQuery({
    queryKey: queryKeys.mealDeadlines,
    queryFn: () => getMealDeadlines(),
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

  if (
    upcomingSchedulesQuery.isPending ||
    registrationsQuery.isPending ||
    deadlinesQuery.isPending
  ) {
    return <LoadingState label="Loading your upcoming meals..." />;
  }

  if (
    upcomingSchedulesQuery.isError ||
    registrationsQuery.isError ||
    deadlinesQuery.isError
  ) {
    return <LoadingState label="We couldn't load your meal dashboard." />;
  }

  const registrations = registrationsQuery.data ?? [];
  const deadlines = deadlinesQuery.data ?? [];
  const today = getDhakaToday();
  const upcomingSchedules = (upcomingSchedulesQuery.data ?? [])
    .filter((schedule) => schedule.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 7);

  const registrationByMealId = new Map(
    registrations.map((registration) => [registration.scheduledMealId, registration])
  );
  const deadlineByType = new Map(deadlines.map((deadline) => [deadline.type, deadline]));
  const totalUpcomingBookings = registrations
    .filter((registration) => {
      const schedule = upcomingSchedules.find((entry) =>
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
        title="Upcoming meal bookings"
        description="Register or cancel your upcoming breakfast, lunch, and dinner bookings. Deadlines follow Dhaka dining time."
      />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>This week at a glance</CardTitle>
            <CardDescription>
              Your next seven schedule dates with live booking controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[calc(var(--radius-field)+0.25rem)] border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Member
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {appUser?.name ?? user?.displayName ?? "Dining member"}
              </p>
            </div>
            <div className="rounded-[calc(var(--radius-field)+0.25rem)] border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Upcoming bookings
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {totalUpcomingBookings}
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

        <Card>
          <CardHeader>
            <CardTitle>Booking notes</CardTitle>
            <CardDescription>
              Availability and deadline checks are enforced by the backend as well.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 size-4 text-foreground" />
              <p>Meal deadlines are evaluated in Dhaka business time, not your browser timezone.</p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 size-4 text-foreground" />
              <p>Registering creates or updates your booking with a default count of 1.</p>
            </div>
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 text-foreground" />
              <p>Cancelling removes your existing registration when the deadline still allows it.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5">
        {upcomingSchedules.length ? (
          upcomingSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              registrationByMealId={registrationByMealId}
              deadlineByType={deadlineByType}
              pendingMealId={pendingMealId}
              onRegister={handleRegister}
              onCancel={handleCancel}
            />
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No upcoming schedules</CardTitle>
              <CardDescription>
                There are no meal schedules available for the next few days yet.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </main>
  );
};

type ScheduleCardProps = {
  schedule: MealSchedule;
  registrationByMealId: Map<string, MealRegistration>;
  deadlineByType: Map<MealType, MealDeadline>;
  pendingMealId: string | null;
  onRegister: (scheduledMealId: string) => Promise<void>;
  onCancel: (registrationId: string, scheduledMealId: string) => Promise<void>;
};

const ScheduleCard = ({
  schedule,
  registrationByMealId,
  deadlineByType,
  pendingMealId,
  onRegister,
  onCancel,
}: ScheduleCardProps) => {
  const meals = [...schedule.meals].sort(
    (left, right) => mealTypeOrder[left.type] - mealTypeOrder[right.type]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3">
              <CalendarDays className="size-5" />
              <span>{formatDateLabel(schedule.date)}</span>
            </CardTitle>
            <CardDescription>
              {meals.length} meal option{meals.length === 1 ? "" : "s"} scheduled for this day.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {meals.map((meal, index) => {
          const registration = registrationByMealId.get(meal.id);
          const deadline = deadlineByType.get(meal.type);
          const deadlinePassed = isDeadlinePassed(schedule.date, deadline);
          const isUnavailable = !meal.isAvailable;
          const isBusy = pendingMealId === meal.id;

          return (
            <div key={meal.id} className="space-y-4">
              {index > 0 ? <Separator /> : null}
              <MealRow
                meal={meal}
                scheduleDate={schedule.date}
                registration={registration}
                deadline={deadline}
                deadlinePassed={deadlinePassed}
                isUnavailable={isUnavailable}
                isBusy={isBusy}
                onRegister={onRegister}
                onCancel={onCancel}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

type MealRowProps = {
  meal: ScheduledMeal;
  scheduleDate: string;
  registration?: MealRegistration;
  deadline?: MealDeadline;
  deadlinePassed: boolean;
  isUnavailable: boolean;
  isBusy: boolean;
  onRegister: (scheduledMealId: string) => Promise<void>;
  onCancel: (registrationId: string, scheduledMealId: string) => Promise<void>;
};

const MealRow = ({
  meal,
  scheduleDate,
  registration,
  deadline,
  deadlinePassed,
  isUnavailable,
  isBusy,
  onRegister,
  onCancel,
}: MealRowProps) => {
  const statusLabel = registration
    ? `Booked${registration.count > 1 ? ` x${registration.count}` : ""}`
    : isUnavailable
      ? "Unavailable"
      : deadlinePassed
        ? "Deadline passed"
        : "Open";

  const statusClassName = registration
    ? "border-success/40 bg-success/10 text-success-foreground"
    : isUnavailable || deadlinePassed
      ? "border-border bg-muted/40 text-muted-foreground"
      : "border-primary/30 bg-primary/10 text-primary-foreground";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
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
            <p className="text-sm text-muted-foreground">
              Weight {String(meal.weight)}
              {meal.menu ? ` • ${meal.menu}` : ""}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClassName}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Deadline: {formatDeadlineLabel(scheduleDate, deadline)}</p>
          <p>{isUnavailable ? "This meal is not available for registration." : "You can manage this meal from here."}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
            {isBusy ? <Spinner className="size-4" /> : <Check />}
            <span>Register</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;
