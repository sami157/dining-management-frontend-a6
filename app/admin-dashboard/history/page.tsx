'use client'

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CalendarClock,
  HandCoins,
  Landmark,
  Lock,
  ReceiptText,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDeposits, getExpenses, getFinalizedMonths } from "@/lib/api/finance";
import { getRegistrations } from "@/lib/api/registrations";
import { getSchedules } from "@/lib/api/schedules";
import { getUsers } from "@/lib/api/users";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/types/app-user";
import type { ExpenseCategory, FinalizedMonth } from "@/lib/types/finance";

const expenseCategoryOptions: ExpenseCategory[] = ["BAZAR", "GAS", "TRANSPORT", "OTHER"];

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  BAZAR: "Bazar",
  GAS: "Gas",
  TRANSPORT: "Transport",
  OTHER: "Other",
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

const moneyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 2,
});

const toNumber = (value: string | number | null | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const formatMoney = (value: string | number | null | undefined) => moneyFormatter.format(toNumber(value));

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "No date";
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00+06:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return shortDateFormatter.format(parsed);
};

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, 1);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return monthFormatter.format(parsed);
};
const isMonthLocked = (finalization?: FinalizedMonth | null) =>
  Boolean(finalization?.finalizedAt) && !finalization?.rolledBackAt;
const getMonthStatusLabel = (finalization?: FinalizedMonth | null) =>
  isMonthLocked(finalization) ? "Finalized and locked" : finalization?.rolledBackAt ? "Rolled back and unlocked" : "Open";

function HistoryMetric({
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

export default function HistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState("");

  const finalizedMonthsQuery = useQuery({
    queryKey: ["finance", "finalized-months"],
    queryFn: () => getFinalizedMonths(),
  });
  const latestKnownFinalizedMonth = (finalizedMonthsQuery.data ?? [])
    .slice()
    .sort((left, right) => right.month.localeCompare(left.month))[0]?.month ?? "";
  const monthForQueries = selectedMonth || latestKnownFinalizedMonth;

  const depositsQuery = useQuery({
    queryKey: ["history", "deposits"],
    queryFn: () => getDeposits(),
  });

  const expensesQuery = useQuery({
    queryKey: ["history", "expenses", monthForQueries],
    queryFn: () => getExpenses({ month: monthForQueries }),
    enabled: Boolean(monthForQueries),
  });

  const usersQuery = useQuery({
    queryKey: ["history", "users"],
    queryFn: () => getUsers(),
  });

  const registrationsQuery = useQuery({
    queryKey: ["history", "registrations"],
    queryFn: () => getRegistrations(),
  });

  const schedulesQuery = useQuery({
    queryKey: ["history", "schedules", monthForQueries],
    queryFn: () => getSchedules({ month: monthForQueries }),
    enabled: Boolean(monthForQueries),
  });

  const finalizedMonths = (finalizedMonthsQuery.data ?? [])
    .slice()
    .sort((left, right) => right.month.localeCompare(left.month));
  const effectiveSelectedMonth = finalizedMonths.some((item) => item.month === selectedMonth)
    ? selectedMonth
    : (finalizedMonths[0]?.month ?? "");
  const selectedFinalization = finalizedMonths.find((item) => item.month === effectiveSelectedMonth) ?? null;

  if (
    finalizedMonthsQuery.isPending ||
    depositsQuery.isPending ||
    usersQuery.isPending ||
    registrationsQuery.isPending ||
    (effectiveSelectedMonth ? expensesQuery.isPending || schedulesQuery.isPending : false)
  ) {
    return <LoadingState label="Loading finalized history..." />;
  }

  if (
    finalizedMonthsQuery.isError ||
    depositsQuery.isError ||
    expensesQuery.isError ||
    usersQuery.isError ||
    registrationsQuery.isError ||
    schedulesQuery.isError
  ) {
    const errorMessage =
      (finalizedMonthsQuery.error instanceof Error && finalizedMonthsQuery.error.message) ||
      (depositsQuery.error instanceof Error && depositsQuery.error.message) ||
      (expensesQuery.error instanceof Error && expensesQuery.error.message) ||
      (usersQuery.error instanceof Error && usersQuery.error.message) ||
      (registrationsQuery.error instanceof Error && registrationsQuery.error.message) ||
      (schedulesQuery.error instanceof Error && schedulesQuery.error.message) ||
      "We couldn't load finalized history.";

    return <LoadingState label={errorMessage} />;
  }

  if (!effectiveSelectedMonth || !selectedFinalization) {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <PageIntro
          eyebrow="Admin"
          title="Month History"
          description="Review locked and rolled-back month summaries after closeout."
        />
        <SectionEmptyState label="No month has been finalized yet." />
      </div>
    );
  }

  const users = usersQuery.data ?? [];
  const memberUsers = users.filter((user) => user.role === "MEMBER");
  const usersById = new Map(users.map((user) => [user.id, user] as const));
  const selectedMonthDeposits = (depositsQuery.data ?? [])
    .filter((deposit) => deposit.month === effectiveSelectedMonth)
    .slice()
    .sort((left, right) => `${right.date}${right.createdAt}`.localeCompare(`${left.date}${left.createdAt}`));
  const selectedMonthExpenses = (expensesQuery.data ?? [])
    .slice()
    .sort((left, right) => `${right.date}${right.createdAt}`.localeCompare(`${left.date}${left.createdAt}`));
  const selectedMonthSchedules = (schedulesQuery.data ?? []).filter(
    (schedule) => schedule.date.slice(0, 7) === effectiveSelectedMonth
  );
  const scheduledMealIds = new Set(
    selectedMonthSchedules.flatMap((schedule) => schedule.meals.map((meal) => meal.id))
  );
  const selectedMonthRegistrations = (registrationsQuery.data ?? []).filter((registration) =>
    scheduledMealIds.has(registration.scheduledMealId)
  );

  const totalDeposits =
    selectedFinalization.totalDeposit != null
      ? toNumber(selectedFinalization.totalDeposit)
      : selectedMonthDeposits.reduce((sum, deposit) => sum + toNumber(deposit.amount), 0);
  const totalExpenses =
    selectedFinalization.totalExpense != null
      ? toNumber(selectedFinalization.totalExpense)
      : selectedMonthExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const closingBalance = totalDeposits - totalExpenses;
  const totalRegistrations = selectedMonthRegistrations.reduce((sum, registration) => sum + registration.count, 0);

  const memberDepositTotals = memberUsers
    .map((member) => ({
      member,
      total: selectedMonthDeposits
        .filter((deposit) => deposit.userId === member.id)
        .reduce((sum, deposit) => sum + toNumber(deposit.amount), 0),
    }))
    .filter((entry) => entry.total > 0)
    .sort((left, right) => right.total - left.total || left.member.name.localeCompare(right.member.name));

  const expenseCategoryTotals = expenseCategoryOptions.map((category) => ({
    category,
    total: selectedMonthExpenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + toNumber(expense.amount), 0),
  }));

  const registrationTotalsByMember = selectedMonthRegistrations
    .reduce<Array<{ user: AppUser | null; total: number }>>((accumulator, registration) => {
      const existing = accumulator.find((entry) => entry.user?.id === registration.userId);
      if (existing) {
        existing.total += registration.count;
        return accumulator;
      }

      accumulator.push({
        user: usersById.get(registration.userId) ?? null,
        total: registration.count,
      });
      return accumulator;
    }, [])
    .sort((left, right) => right.total - left.total || (left.user?.name ?? "").localeCompare(right.user?.name ?? ""));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageIntro
        eyebrow="Admin"
        title="Month History"
        description="Review locked and rolled-back month summaries, contribution ledgers, expense breakdowns, and meal registration totals after closeout."
      />

      <Card className="bg-card">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Month History</CardTitle>
            <CardDescription>Switch between finalized and rolled-back months to inspect their status.</CardDescription>
          </div>
          <div className="max-w-xs">
            <Select value={effectiveSelectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {finalizedMonths.map((item: FinalizedMonth) => (
                  <SelectItem key={item.month} value={item.month}>
                    {formatMonthLabel(item.month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HistoryMetric
            icon={Wallet}
            label="Total deposit"
            value={formatMoney(totalDeposits)}
            detail={`${selectedMonthDeposits.length} deposit record${selectedMonthDeposits.length === 1 ? "" : "s"}`}
            tone="positive"
          />
          <HistoryMetric
            icon={ReceiptText}
            label="Total expense"
            value={formatMoney(totalExpenses)}
            detail={`${selectedMonthExpenses.length} expense record${selectedMonthExpenses.length === 1 ? "" : "s"}`}
            tone="negative"
          />
          <HistoryMetric
            icon={Landmark}
            label="Net month change"
            value={formatMoney(closingBalance)}
            detail={`Meal rate ${formatMoney(selectedFinalization.mealRate ?? 0)}`}
            tone={closingBalance >= 0 ? "positive" : "negative"}
          />
          <HistoryMetric
            icon={UtensilsCrossed}
            label="Meal bookings"
            value={String(totalRegistrations)}
            detail={`${selectedMonthRegistrations.length} registration record${selectedMonthRegistrations.length === 1 ? "" : "s"}`}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="size-5" />
              <span>Member Contributions</span>
            </CardTitle>
            <CardDescription>Read-only contribution totals for the selected finalized month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberDepositTotals.length ? (
              memberDepositTotals.map(({ member, total }) => (
                <div key={member.id} className="rounded-xl bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <p className="font-semibold text-foreground">{formatMoney(total)}</p>
                  </div>
                </div>
              ))
            ) : (
              <SectionEmptyState label={`No deposits were recorded for ${formatMonthLabel(effectiveSelectedMonth)}.`} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5" />
              <span>Closeout Details</span>
            </CardTitle>
            <CardDescription>Metadata captured when the month was locked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Month</p>
              <p className="mt-2 font-semibold text-foreground">{formatMonthLabel(effectiveSelectedMonth)}</p>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
              <p className="mt-2 font-semibold text-foreground">{getMonthStatusLabel(selectedFinalization)}</p>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Finalized on</p>
              <p className="mt-2 font-semibold text-foreground">{formatDate(selectedFinalization.finalizedAt)}</p>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Rolled back on</p>
              <p className="mt-2 font-semibold text-foreground">{formatDate(selectedFinalization.rolledBackAt)}</p>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meal rate</p>
              <p className="mt-2 font-semibold text-foreground">{formatMoney(selectedFinalization.mealRate ?? 0)}</p>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recorded by</p>
              <p className="mt-2 font-semibold text-foreground">
                {selectedFinalization.finalizedById
                  ? usersById.get(selectedFinalization.finalizedById)?.name ?? "Unknown user"
                  : "Not available"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="size-5" />
              <span>Expense Categories</span>
            </CardTitle>
            <CardDescription>How expenses were distributed across categories for the locked month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenseCategoryTotals.some((item) => item.total > 0) ? (
              expenseCategoryTotals.map((item) => (
                <div key={item.category} className="rounded-xl bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{expenseCategoryLabels[item.category]}</p>
                    <p className="font-semibold text-foreground">{formatMoney(item.total)}</p>
                  </div>
                </div>
              ))
            ) : (
              <SectionEmptyState label={`No expenses were recorded for ${formatMonthLabel(effectiveSelectedMonth)}.`} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5" />
              <span>Registration Totals</span>
            </CardTitle>
            <CardDescription>Read-only meal registration counts attributed to each member.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {registrationTotalsByMember.length ? (
              registrationTotalsByMember.map(({ user, total }, index) => (
                <div key={`${user?.id ?? "unknown"}-${index}`} className="rounded-xl bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{user?.name ?? "Unknown member"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email ?? "No email available"}</p>
                    </div>
                    <p className="font-semibold text-foreground">{total}</p>
                  </div>
                </div>
              ))
            ) : (
              <SectionEmptyState label={`No registrations were captured for ${formatMonthLabel(effectiveSelectedMonth)}.`} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
