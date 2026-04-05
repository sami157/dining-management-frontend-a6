'use client'

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ShieldCheck, SunMedium, UserCheck, Users, UtensilsCrossed, Weight } from "lucide-react";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDailyStats, getManagerStats, getOverviewStats } from "@/lib/api/stats";
import type { DailyMealTypeStats, ManagerSummary } from "@/lib/types/stats";
import { cn } from "@/lib/utils";

const mealTypeLabels: Record<DailyMealTypeStats["type"], string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

const getDhakaToday = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

function OverviewMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p
            className={cn("text-2xl font-semibold text-foreground", {
              "text-emerald-600": tone === "positive",
              "text-rose-600": tone === "negative",
            })}
          >
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function SectionEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export default function AdminDashboardPage() {
  const today = getDhakaToday();
  const overviewQuery = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: getOverviewStats,
  });
  const managersQuery = useQuery({
    queryKey: ["stats", "managers"],
    queryFn: getManagerStats,
  });
  const dailyStatsQuery = useQuery({
    queryKey: ["stats", "daily", today],
    queryFn: () => getDailyStats(today),
  });

  if (overviewQuery.isPending || managersQuery.isPending || dailyStatsQuery.isPending) {
    return <LoadingState label="Loading dashboard overview..." />;
  }

  if (overviewQuery.isError || managersQuery.isError || dailyStatsQuery.isError) {
    return <LoadingState label="We couldn't load the dashboard stats." />;
  }

  const overview = overviewQuery.data;
  const dailyStats = dailyStatsQuery.data;
  const managers = (managersQuery.data ?? [])
    .slice()
    .sort((left, right) => Number(right.isActive) - Number(left.isActive) || left.name.localeCompare(right.name));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageIntro
        eyebrow="Manager"
        title="Manager dashboard overview"
        description="Live operational counts and manager directory data pulled from the new stats endpoints."
      />

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>System overview</CardTitle>
          <CardDescription>
            Snapshot for {overview.currentMonth}. Locked months and user-role counts come from `/stats/overview`.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewMetric
            icon={Users}
            label="Total users"
            value={String(overview.users.total)}
            detail={`${overview.users.active} active, ${overview.users.inactive} inactive`}
          />
          <OverviewMetric
            icon={UserCheck}
            label="Active members"
            value={String(overview.roles.activeMembers)}
            detail={`${overview.roles.members} total members`}
            tone="positive"
          />
          <OverviewMetric
            icon={ShieldCheck}
            label="Staff roles"
            value={`${overview.roles.admins + overview.roles.managers}`}
            detail={`${overview.roles.admins} admins and ${overview.roles.managers} managers`}
          />
          <OverviewMetric
            icon={CalendarClock}
            label="Locked months"
            value={String(overview.finalization.lockedMonths)}
            detail="Months currently finalized and locked"
          />
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Daily meal analytics</CardTitle>
          <CardDescription>
            Aggregated daily stats for {dailyStats.date} from `/stats/daily`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewMetric
              icon={UtensilsCrossed}
              label="Meals registered"
              value={String(dailyStats.meals.totalMealsRegistered)}
              detail={`${dailyStats.meals.totalRegistrations} member registrations`}
              tone="positive"
            />
            <OverviewMetric
              icon={Weight}
              label="Weighted meals"
              value={String(dailyStats.meals.totalWeightedMeals)}
              detail="Operational weighted total for the day"
            />
            <OverviewMetric
              icon={SunMedium}
              label="Available meals"
              value={String(dailyStats.meals.availableMealCount)}
              detail={dailyStats.hasSchedule ? "Meal slots configured on schedule" : "No schedule configured yet"}
            />
            <OverviewMetric
              icon={CalendarClock}
              label="Schedule status"
              value={dailyStats.hasSchedule ? "Active" : "Empty"}
              detail={dailyStats.hasSchedule ? "The day has a meal schedule" : "All daily totals correctly return zero"}
            />
          </div>

          {dailyStats.meals.byType.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {dailyStats.meals.byType.map((meal) => (
                <div key={meal.type} className="rounded-xl bg-background px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{mealTypeLabels[meal.type]}</p>
                      <p className="text-sm text-muted-foreground">
                        {meal.totalMealsRegistered} meals, {meal.totalWeightedMeals} weighted
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        meal.isAvailable ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {meal.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    Weight {meal.weight} | {meal.totalRegistrations} registrations
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState label="No meal schedule exists for today yet. Daily stats stay at zero instead of erroring." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Role distribution</CardTitle>
            <CardDescription>Current user split across admin, manager, and member roles.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-xl bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">Admins</p>
                <p className="font-semibold text-foreground">{overview.roles.admins}</p>
              </div>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">Managers</p>
                <p className="font-semibold text-foreground">{overview.roles.managers}</p>
              </div>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">Members</p>
                <p className="font-semibold text-foreground">{overview.roles.members}</p>
              </div>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">Inactive users</p>
                <p className="font-semibold text-foreground">{overview.users.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Manager directory</CardTitle>
            <CardDescription>Directory data loaded from `/stats/managers`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {managers.length ? (
              managers.map((manager: ManagerSummary) => (
                <div key={manager.id} className="rounded-xl bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{manager.name}</p>
                      <p className="text-sm text-muted-foreground">{manager.email}</p>
                      <p className="text-sm text-muted-foreground">{manager.mobile ?? "No mobile added"}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-semibold",
                          manager.isActive
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-rose-500/10 text-rose-700"
                        )}
                      >
                        {manager.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <SectionEmptyState label="No managers are available yet." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
