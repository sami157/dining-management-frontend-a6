'use client'

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Trophy,
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
    description: "Manage schedules, deadlines, registrations, finances",
    icon: UtensilsCrossed,
  },
  {
    title: "Role-Based Access",
    description: "Seperate access for Members, Managers and Admins with clear permissions",
    icon: ShieldCheck,
  },
  {
    title: "Finance Tracking",
    description: "Follow contributions, expenses, and month closeout in one place.",
    icon: Wallet,
  },
];

const processSteps = [
  {
    title: "Register Meals",
    description: "Members choose breakfast, lunch, and dinner meals before the deadline.",
    icon: UtensilsCrossed,
  },
  {
    title: "Run Operations",
    description: "Managers oversee schedules, registrations, deposits, and monthly operations.",
    icon: Clock3,
  },
  {
    title: "Close The Month",
    description: "Finalization locks the month and computes the operational meal rate from weighted usage.",
    icon: CheckCircle2,
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

const amountFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 2,
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

const formatAmount = (value: number) => amountFormatter.format(value);

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
    <div className="rounded-2xl bg-background px-4 py-4">
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
        <section className="grid gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Dining Management
              </p>
              <h1 className="title-font max-w-3xl text-5xl tracking-tight text-foreground">
                Web-Based Solution For Managing Community Dinings That Just...Works
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                Streamline your dining operations with a system designed for the full meal cycle,
                from scheduling and registrations to financial tracking and monthly closeout. Say
                goodbye to manual spreadsheets and hello to operational clarity for everyone.
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
                    Create Account
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Stats
            </p>
            <h2 className="title-font text-3xl text-foreground">Live Monthly Snapshot</h2>
          </div>
          {publicStats ? (
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <PublicMetric
                icon={Users}
                label="Active members"
                value={String(publicStats.community.activeMembers)}
                detail={`${publicStats.community.activeManagers} active managers`}
              />
              <PublicMetric
                icon={HandCoins}
                label="Monthly deposits"
                value={formatAmount(publicStats.finance.totalDeposits)}
                detail={`Tracked for ${formatMonthLabel(publicStats.month)}`}
              />
              <PublicMetric
                icon={Wallet}
                label="Monthly expenses"
                value={formatAmount(publicStats.finance.totalExpenses)}
                detail="Operational spending for the selected month"
              />
              <PublicMetric
                icon={UtensilsCrossed}
                label="Meals registered"
                value={String(publicStats.meals.totalMealsRegistered)}
                detail='Includes registrations across all registered accounts'
              />
              <PublicMetric
                icon={Wallet}
                label="Weighted meals"
                value={String(publicStats.meals.totalWeightedMeals)}
                detail={`${publicStats.meals.scheduleCount} scheduled day${publicStats.meals.scheduleCount === 1 ? "" : "s"}`}
              />
              <PublicMetric
                icon={Trophy}
                label="Top depositor"
                value={publicStats.highlights.topDepositor?.name ?? "No data"}
                detail={
                  publicStats.highlights.topDepositor
                    ? `${formatAmount(publicStats.highlights.topDepositor.totalAmount)} deposited`
                    : "No deposits recorded this month"
                }
              />
              <PublicMetric
                icon={CheckCircle2}
                label="Top consumer"
                value={publicStats.highlights.topConsumer?.name ?? "No data"}
                detail={
                  publicStats.highlights.topConsumer
                    ? `${publicStats.highlights.topConsumer.totalWeightedMeals} weighted meals`
                    : "No meal registrations recorded this month"
                }
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
          ) : (
            <div className={cn("rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground")}>
              Public stats could not be loaded: {publicStatsError ?? "Request failed."}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              How It Works
            </p>
            <h2 className="title-font text-3xl text-foreground">3 Steps From Meal Plan To Closeout</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step) => {
              const Icon = step.icon;

              return (
                <Card key={step.title}>
                  <CardHeader className="space-y-4">
                    <div className="flex size-12 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Core Capabilities
            </p>
            <h2 className="title-font text-3xl text-foreground">Built For Daily Operations And Monthly Accountability</h2>
          </div>
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
        </section>
      </section>
    </main>
  );
}
