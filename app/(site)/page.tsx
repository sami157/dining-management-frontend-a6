'use client'

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  ShieldCheck,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPublicStats } from "@/lib/api/stats";
import { getDashboardRoute } from "@/lib/auth/routes";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Meal Operations",
    description: "Manage schedules, deadlines, and registrations around Dhaka business dates.",
    icon: UtensilsCrossed,
  },
  {
    title: "Role-Based Access",
    description: "Keep member, manager, and admin flows separate without duplicating page shells.",
    icon: ShieldCheck,
  },
  {
    title: "Finance Tracking",
    description: "Prepare deposits, expenses, and finalization views behind the new route structure.",
    icon: Wallet,
  },
];

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
    return "Not finalized";
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00+06:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return shortDateFormatter.format(parsed);
};

function PublicMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, appUser } = useAuth();
  const publicStatsQuery = useQuery({
    queryKey: ["stats", "public"],
    queryFn: () => getPublicStats(),
  });

  const publicStats = publicStatsQuery.data;
  const publicStatsError =
    publicStatsQuery.error instanceof Error ? publicStatsQuery.error.message : null;

  return (
    <main className="bg-shell flex-1">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Dining Management
              </p>
              <h1 className="title-font max-w-3xl text-5xl tracking-tight text-foreground">
                Community dining stats and operations now stay in one place.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                Public homepage stats now reflect this month&apos;s live meal activity, while
                protected dashboards expose deeper operational and finance analytics for managers
                and admins.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button onClick={() => router.push(getDashboardRoute(appUser?.role))}>
                  Open dashboard
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <>
                  <Button onClick={() => router.push("/login")}>
                    Login
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/register")}>
                    Create account
                  </Button>
                </>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">This month at a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {publicStatsQuery.isPending ? (
                <p>Loading public stats...</p>
              ) : publicStats ? (
                <>
                  <p>{formatMonthLabel(publicStats.month)} community overview.</p>
                  <p>
                    {publicStats.finalization.isFinalized
                      ? `Finalized on ${formatDate(publicStats.finalization.finalizedAt)}`
                      : "Month is currently open"}
                  </p>
                  <p>
                    {publicStats.finalization.rolledBackAt
                      ? `Rolled back on ${formatDate(publicStats.finalization.rolledBackAt)}`
                      : publicStats.finalization.mealRate != null
                        ? `Meal rate ${publicStats.finalization.mealRate}`
                        : "Meal rate will appear after finalization"}
                  </p>
                </>
              ) : publicStatsError ? (
                <p>{publicStatsError}</p>
              ) : (
                <p>Public monthly stats are unavailable right now.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {publicStats ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PublicMetric
              icon={Users}
              label="Active members"
              value={String(publicStats.community.activeMembers)}
              detail={`${publicStats.community.activeManagers} active managers`}
            />
            <PublicMetric
              icon={UtensilsCrossed}
              label="Meals registered"
              value={String(publicStats.meals.totalMealsRegistered)}
              detail={`${publicStats.meals.totalRegistrations} registration rows`}
            />
            <PublicMetric
              icon={Wallet}
              label="Weighted meals"
              value={String(publicStats.meals.totalWeightedMeals)}
              detail={`${publicStats.meals.scheduleCount} scheduled day${publicStats.meals.scheduleCount === 1 ? "" : "s"}`}
            />
            <PublicMetric
              icon={CalendarClock}
              label="Month status"
              value={publicStats.finalization.isFinalized ? "Finalized" : "Open"}
              detail={
                publicStats.finalization.rolledBackAt
                  ? `Rolled back on ${formatDate(publicStats.finalization.rolledBackAt)}`
                  : publicStats.finalization.isFinalized
                    ? `Finalized on ${formatDate(publicStats.finalization.finalizedAt)}`
                    : `Tracking ${formatMonthLabel(publicStats.month)}`
              }
            />
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title}>
                <CardHeader className="space-y-4">
                  <div className="flex size-12 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {publicStatsQuery.isError ? (
          <div className={cn("rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground")}>
            Public stats could not be loaded: {publicStatsError ?? "Request failed."}
          </div>
        ) : null}
      </section>
    </main>
  );
}
