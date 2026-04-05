'use client'

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BanknoteArrowDown,
  Check,
  ChevronsUpDown,
  HandCoins,
  Landmark,
  Lock,
  Pencil,
  ReceiptText,
  Save,
  Trash2,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  createDeposit,
  createExpense,
  deleteDeposit,
  deleteExpense,
  finalizeMonth,
  getDeposits,
  getExpenses,
  getFinalizedMonths,
  updateDeposit,
  updateExpense,
} from "@/lib/api/finance";
import { getUsers } from "@/lib/api/users";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/types/app-user";
import type { Deposit, Expense, ExpenseCategory, FinalizedMonth } from "@/lib/types/finance";
import { useAuth } from "@/providers/AuthProvider";

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

const currentYear = getDhakaDateParts().year;

const currentYearMonthOptions = Array.from({ length: 12 }, (_, index) => {
  const value = `${currentYear}-${String(index + 1).padStart(2, "0")}`;
  const date = new Date(Number(currentYear), index, 1);

  return {
    value,
    label: monthFormatter.format(date),
  };
});

const getCurrentMonth = () => getDhakaToday().slice(0, 7);

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

const normalizeDateValue = (value: string) => (value.includes("T") ? value.slice(0, 10) : value);
const getMonthFromDate = (value: string) => value.slice(0, 7);
const isMonthLocked = (finalization?: FinalizedMonth | null) =>
  Boolean(finalization?.finalizedAt) && !finalization?.rolledBackAt;
const getMonthStatusLabel = (finalization?: FinalizedMonth | null) =>
  isMonthLocked(finalization) ? "Locked" : finalization?.rolledBackAt ? "Rolled back" : "Open";

const buildDepositFormState = (defaultUserId = "") => ({
  userId: defaultUserId,
  amount: "",
  note: "",
  date: getDhakaToday(),
});

const buildExpenseFormState = () => ({
  amount: "",
  date: getDhakaToday(),
  category: "BAZAR" as ExpenseCategory,
  personName: "",
  description: "",
});

const mapDepositToEditor = (deposit: Deposit) => ({
  userId: deposit.userId,
  amount: String(deposit.amount),
  note: deposit.note ?? "",
  date: normalizeDateValue(deposit.date),
});

const mapExpenseToEditor = (expense: Expense) => ({
  amount: String(expense.amount),
  date: normalizeDateValue(expense.date),
  category: expense.category,
  personName: expense.personName,
  description: expense.description ?? "",
});

function SectionEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-xl bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p
        className={cn("mt-2 text-xl font-semibold text-foreground", {
          "text-emerald-600": tone === "positive",
          "text-rose-600": tone === "negative",
        })}
      >
        {value}
      </p>
    </div>
  );
}

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
      member.email.toLowerCase().includes(normalizedSearch)
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
            {selectedMember ? selectedMember.name : placeholder}
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
                  <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
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

export default function FundManagementPage() {
  const queryClient = useQueryClient();
  const { refreshAppUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [depositForm, setDepositForm] = useState(() => buildDepositFormState());
  const [expenseForm, setExpenseForm] = useState(buildExpenseFormState);
  const [depositEditors, setDepositEditors] = useState<Record<string, ReturnType<typeof mapDepositToEditor>>>({});
  const [expenseEditors, setExpenseEditors] = useState<Record<string, ReturnType<typeof mapExpenseToEditor>>>({});

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getUsers,
  });

  const depositsQuery = useQuery({
    queryKey: ["finance", "deposits"],
    queryFn: () => getDeposits(),
  });

  const expensesQuery = useQuery({
    queryKey: ["finance", "expenses", selectedMonth],
    queryFn: () => getExpenses({ month: selectedMonth }),
  });

  const finalizedMonthsQuery = useQuery({
    queryKey: ["finance", "finalized-months"],
    queryFn: getFinalizedMonths,
  });

  const memberUsers = (usersQuery.data ?? []).filter((user) => user.role === "MEMBER" && user.isActive);
  const selectedDepositUserId = depositForm.userId || memberUsers[0]?.id || "";

  const syncBalances = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser }),
      queryClient.invalidateQueries({ queryKey: ["history"] }),
    ]);
    await refreshAppUser();
  };

  const syncFinance = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["finance", "deposits"] }),
      queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["finance", "finalized-months"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] }),
      queryClient.invalidateQueries({ queryKey: ["member-registrations"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.myRegistrations }),
      queryClient.invalidateQueries({ queryKey: ["upcoming-schedules"] }),
    ]);
  };

  const createDepositMutation = useMutation({
    mutationFn: createDeposit,
    onSuccess: async () => {
      await Promise.all([syncFinance(), syncBalances()]);
      setDepositForm(buildDepositFormState(memberUsers[0]?.id ?? ""));
      toast.success("Deposit recorded.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to record deposit.");
    },
  });

  const updateDepositMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateDeposit>[1] }) =>
      updateDeposit(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([syncFinance(), syncBalances()]);
      setDepositEditors((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      toast.success("Deposit updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update deposit.");
    },
  });

  const deleteDepositMutation = useMutation({
    mutationFn: deleteDeposit,
    onSuccess: async () => {
      await Promise.all([syncFinance(), syncBalances()]);
      toast.success("Deposit deleted.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete deposit.");
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      await syncFinance();
      setExpenseForm(buildExpenseFormState());
      toast.success("Expense recorded.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to record expense.");
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateExpense>[1] }) =>
      updateExpense(id, payload),
    onSuccess: async (_, variables) => {
      await syncFinance();
      setExpenseEditors((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      toast.success("Expense updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update expense.");
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: async () => {
      await syncFinance();
      toast.success("Expense deleted.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete expense.");
    },
  });

  const finalizeMonthMutation = useMutation({
    mutationFn: finalizeMonth,
    onSuccess: async () => {
      await Promise.all([syncFinance(), syncBalances()]);
      toast.success("Month finalized.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to finalize month.");
    },
  });

  if (
    usersQuery.isPending ||
    depositsQuery.isPending ||
    expensesQuery.isPending ||
    finalizedMonthsQuery.isPending
  ) {
    return <LoadingState label="Loading fund management..." />;
  }

  if (
    usersQuery.isError ||
    depositsQuery.isError ||
    expensesQuery.isError ||
    finalizedMonthsQuery.isError
  ) {
    return <LoadingState label="We couldn't load the fund management data." />;
  }

  const usersById = new Map((usersQuery.data ?? []).map((user) => [user.id, user]));
  const selectedMonthDeposits = (depositsQuery.data ?? [])
    .filter((deposit) => deposit.month === selectedMonth)
    .slice()
    .sort((left, right) => `${right.date}${right.createdAt}`.localeCompare(`${left.date}${left.createdAt}`));
  const selectedMonthExpenses = (expensesQuery.data ?? [])
    .slice()
    .sort((left, right) => `${right.date}${right.createdAt}`.localeCompare(`${left.date}${left.createdAt}`));
  const finalizedMonths = (finalizedMonthsQuery.data ?? [])
    .slice()
    .sort((left, right) => right.month.localeCompare(left.month));
  const selectedMonthFinalization = finalizedMonths.find((item) => item.month === selectedMonth) ?? null;
  const selectedMonthLocked = isMonthLocked(selectedMonthFinalization);

  const totalDeposits = selectedMonthDeposits.reduce((sum, deposit) => sum + toNumber(deposit.amount), 0);
  const totalExpenses = selectedMonthExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const netMonthChange = totalDeposits - totalExpenses;
  const expenseTotalsByCategory = expenseCategoryOptions.map((category) => ({
    category,
    total: selectedMonthExpenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + toNumber(expense.amount), 0),
  }));
  const memberSummaries = memberUsers
    .map((member) => ({
      member,
      total: selectedMonthDeposits
        .filter((deposit) => deposit.userId === member.id)
        .reduce((sum, deposit) => sum + toNumber(deposit.amount), 0),
    }))
    .sort((left, right) => right.total - left.total || left.member.name.localeCompare(right.member.name));

  const handleCreateDeposit = async () => {
    const amount = Number(depositForm.amount);

    if (!selectedDepositUserId) {
      toast.error("Select a member first.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Deposit amount must be greater than zero.");
      return;
    }

    await createDepositMutation.mutateAsync({
      userId: selectedDepositUserId,
      amount,
      month: getMonthFromDate(depositForm.date),
      ...(depositForm.note.trim() ? { note: depositForm.note.trim() } : {}),
      ...(depositForm.date ? { date: depositForm.date } : {}),
    });
  };

  const handleCreateExpense = async () => {
    const amount = Number(expenseForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Expense amount must be greater than zero.");
      return;
    }

    if (!expenseForm.personName.trim()) {
      toast.error("Expense person name is required.");
      return;
    }

    await createExpenseMutation.mutateAsync({
      amount,
      month: getMonthFromDate(expenseForm.date),
      category: expenseForm.category,
      personName: expenseForm.personName.trim(),
      ...(expenseForm.description.trim() ? { description: expenseForm.description.trim() } : {}),
      ...(expenseForm.date ? { date: expenseForm.date } : {}),
    });
  };

  const handleSaveDeposit = async (depositId: string) => {
    const editor = depositEditors[depositId];

    if (!editor) {
      return;
    }

    const amount = Number(editor.amount);

    if (!editor.userId) {
      toast.error("Select a member first.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Deposit amount must be greater than zero.");
      return;
    }

    await updateDepositMutation.mutateAsync({
      id: depositId,
      payload: {
        userId: editor.userId,
        amount,
        month: getMonthFromDate(editor.date),
        note: editor.note.trim(),
        date: editor.date,
      },
    });
  };

  const handleSaveExpense = async (expenseId: string) => {
    const editor = expenseEditors[expenseId];

    if (!editor) {
      return;
    }

    const amount = Number(editor.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Expense amount must be greater than zero.");
      return;
    }

    if (!editor.personName.trim()) {
      toast.error("Expense person name is required.");
      return;
    }

    await updateExpenseMutation.mutateAsync({
      id: expenseId,
      payload: {
        amount,
        month: getMonthFromDate(editor.date),
        date: editor.date,
        category: editor.category,
        personName: editor.personName.trim(),
        description: editor.description.trim(),
      },
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageIntro
        eyebrow="Admin"
        title="Fund Management"
        description="Track monthly deposits and expenses, monitor member contributions, and finalize a month once the ledger is complete."
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="size-5" />
                  <span>Monthly Summary</span>
                </CardTitle>
                <CardDescription>
                  Review the active month before recording more transactions or locking it.
                </CardDescription>
              </div>

              <div className="w-full max-w-56 space-y-2">
                <Label htmlFor="selected-month">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="selected-month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentYearMonthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl bg-background px-4 py-3 text-sm text-muted-foreground">
              {selectedMonthLocked ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Lock className="size-4 text-emerald-600" />
                  <span>
                    {formatMonthLabel(selectedMonth)} is finalized.
                    {selectedMonthFinalization.finalizedAt
                      ? ` Locked on ${formatDate(selectedMonthFinalization.finalizedAt)}.`
                      : ""}
                  </span>
                </div>
              ) : selectedMonthFinalization?.rolledBackAt ? (
                <div className="flex flex-wrap items-center gap-2">
                  <HandCoins className="size-4 text-amber-600" />
                  <span>
                    {formatMonthLabel(selectedMonth)} was rolled back.
                    {selectedMonthFinalization.rolledBackAt
                      ? ` Reopened on ${formatDate(selectedMonthFinalization.rolledBackAt)}.`
                      : ""}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <HandCoins className="size-4 text-amber-600" />
                  <span>{formatMonthLabel(selectedMonth)} is still open for deposits and expenses.</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryMetric label="Deposits" value={formatMoney(totalDeposits)} tone="positive" />
              <SummaryMetric label="Expenses" value={formatMoney(totalExpenses)} tone="negative" />
              <SummaryMetric
                label="Net month change"
                value={formatMoney(netMonthChange)}
                tone={netMonthChange >= 0 ? "positive" : "negative"}
              />
              <SummaryMetric
                label="Depositors"
                value={String(memberSummaries.filter((item) => item.total > 0).length)}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-xl bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-lg text-foreground">Month Finalization</p>
                    <p className="text-sm text-muted-foreground">
                      Deposits now update live balances immediately. Finalization only locks the month and deducts meal cost. Rollback reopens the month.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => finalizeMonthMutation.mutate({ month: selectedMonth })}
                    disabled={selectedMonthLocked || finalizeMonthMutation.isPending}
                  >
                    {finalizeMonthMutation.isPending ? <Spinner className="size-4" /> : <Lock />}
                    <span>Finalize</span>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {expenseTotalsByCategory.map((item) => (
                  <div key={item.category} className="rounded-xl bg-background px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {expenseCategoryLabels[item.category]}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatMoney(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-5" />
              <span>Finalized months</span>
            </CardTitle>
            <CardDescription>Recent locked months from the finance history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {finalizedMonths.length ? (
              finalizedMonths.slice(0, 6).map((item: FinalizedMonth) => (
                <div key={item.month} className="rounded-xl bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{formatMonthLabel(item.month)}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        isMonthLocked(item)
                          ? "bg-emerald-500/10 text-emerald-700"
                          : item.rolledBackAt
                            ? "bg-amber-500/10 text-amber-700"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {getMonthStatusLabel(item)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isMonthLocked(item)
                      ? (item.finalizedAt ? `Finalized on ${formatDate(item.finalizedAt)}` : "Finalized month")
                      : item.rolledBackAt
                        ? `Rolled back on ${formatDate(item.rolledBackAt)}`
                        : "Open month"}
                  </p>
                </div>
              ))
            ) : (
              <SectionEmptyState label="No month has been finalized yet." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BanknoteArrowDown className="size-5" />
              <span>Record deposit</span>
            </CardTitle>
            <CardDescription>Add a member contribution for any month.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Member</Label>
              <MemberPicker
                value={selectedDepositUserId}
                members={memberUsers}
                onChange={(value) => setDepositForm((current) => ({ ...current, userId: value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                min="0"
                step="0.01"
                value={depositForm.amount}
                onChange={(event) => setDepositForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-date">Date</Label>
              <DatePicker
                id="deposit-date"
                value={depositForm.date}
                onChange={(value) => setDepositForm((current) => ({ ...current, date: value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deposit-note">Note</Label>
              <Input
                id="deposit-note"
                value={depositForm.note}
                onChange={(event) => setDepositForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Cash deposit"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={handleCreateDeposit}
                disabled={
                  createDepositMutation.isPending ||
                  !memberUsers.length ||
                  isMonthLocked(finalizedMonths.find((item) => item.month === getMonthFromDate(depositForm.date)) ?? null)
                }
              >
                {createDepositMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                <span>Save deposit</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="size-5" />
              <span>Record expense</span>
            </CardTitle>
            <CardDescription>Keep expense entries categorized for the month summary.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="1800"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) =>
                  setExpenseForm((current) => ({ ...current, category: value as ExpenseCategory }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {expenseCategoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-person">Spent by</Label>
              <Input
                id="expense-person"
                value={expenseForm.personName}
                onChange={(event) => setExpenseForm((current) => ({ ...current, personName: event.target.value }))}
                placeholder="Rakib"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <DatePicker
                id="expense-date"
                value={expenseForm.date}
                onChange={(value) => setExpenseForm((current) => ({ ...current, date: value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                value={expenseForm.description}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Vegetables and fish"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={handleCreateExpense}
                disabled={
                  createExpenseMutation.isPending ||
                  isMonthLocked(finalizedMonths.find((item) => item.month === getMonthFromDate(expenseForm.date)) ?? null)
                }
              >
                {createExpenseMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                <span>Save expense</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Deposits for {formatMonthLabel(selectedMonth)}</CardTitle>
            <CardDescription>Member contributions and running monthly totals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMonthDeposits.length ? (
              selectedMonthDeposits.map((deposit) => {
                const editor = depositEditors[deposit.id];
                const depositUser = deposit.user ?? usersById.get(deposit.userId);

                return (
                  <div key={deposit.id} className="rounded-xl bg-background p-4">
                    {editor ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Member</Label>
                          <MemberPicker
                            value={editor.userId}
                            members={memberUsers}
                            onChange={(value) =>
                              setDepositEditors((current) => ({
                                ...current,
                                [deposit.id]: { ...editor, userId: value },
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editor.amount}
                            onChange={(event) =>
                              setDepositEditors((current) => ({
                                ...current,
                                [deposit.id]: { ...editor, amount: event.target.value },
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Date</Label>
                          <DatePicker
                            value={editor.date}
                            onChange={(value) =>
                              setDepositEditors((current) => ({
                                ...current,
                                [deposit.id]: { ...editor, date: value },
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Note</Label>
                          <Input
                            value={editor.note}
                            onChange={(event) =>
                              setDepositEditors((current) => ({
                                ...current,
                                [deposit.id]: { ...editor, note: event.target.value },
                              }))
                            }
                          />
                        </div>

                        <div className="flex gap-2 md:col-span-2">
                          <Button
                            type="button"
                            onClick={() => handleSaveDeposit(deposit.id)}
                            disabled={
                              updateDepositMutation.isPending ||
                              isMonthLocked(
                                finalizedMonths.find((item) => item.month === getMonthFromDate(editor.date)) ?? null
                              )
                            }
                          >
                            {updateDepositMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                            <span>Save</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setDepositEditors((current) => {
                                const next = { ...current };
                                delete next[deposit.id];
                                return next;
                              })
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{depositUser?.name ?? "Unknown member"}</p>
                            <span className="text-sm text-muted-foreground">{formatDate(deposit.date)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {deposit.note?.trim() ? deposit.note : "No note added."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-24 text-right font-semibold text-emerald-600">
                            {formatMoney(deposit.amount)}
                          </p>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={() =>
                              setDepositEditors((current) => ({
                                ...current,
                                [deposit.id]: mapDepositToEditor(deposit),
                              }))
                            }
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="destructive"
                            onClick={() => deleteDepositMutation.mutate(deposit.id)}
                            disabled={
                              deleteDepositMutation.isPending ||
                              isMonthLocked(finalizedMonths.find((item) => item.month === deposit.month) ?? null)
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <SectionEmptyState label={`No deposits have been recorded for ${formatMonthLabel(selectedMonth)}.`} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member contribution totals</CardTitle>
            <CardDescription>Quick month-level contribution view for active members.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberSummaries.length ? (
              memberSummaries.map(({ member, total }: { member: AppUser; total: number }) => (
                <div key={member.id} className="rounded-xl bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatMoney(total)}</p>
                      <p className="text-xs text-muted-foreground">Balance {formatMoney(member.balance)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <SectionEmptyState label="No active members are available for contribution tracking." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses for {formatMonthLabel(selectedMonth)}</CardTitle>
          <CardDescription>Categorized spending entries for the active month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMonthExpenses.length ? (
            selectedMonthExpenses.map((expense) => {
              const editor = expenseEditors[expense.id];

              return (
                <div key={expense.id} className="rounded-xl bg-background p-4">
                  {editor ? (
                      <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editor.amount}
                          onChange={(event) =>
                            setExpenseEditors((current) => ({
                              ...current,
                              [expense.id]: { ...editor, amount: event.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={editor.category}
                          onValueChange={(value) =>
                            setExpenseEditors((current) => ({
                              ...current,
                              [expense.id]: { ...editor, category: value as ExpenseCategory },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategoryOptions.map((category) => (
                              <SelectItem key={category} value={category}>
                                {expenseCategoryLabels[category]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Spent by</Label>
                        <Input
                          value={editor.personName}
                          onChange={(event) =>
                            setExpenseEditors((current) => ({
                              ...current,
                              [expense.id]: { ...editor, personName: event.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Date</Label>
                        <DatePicker
                          value={editor.date}
                          onChange={(value) =>
                            setExpenseEditors((current) => ({
                              ...current,
                              [expense.id]: { ...editor, date: value },
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={editor.description}
                          onChange={(event) =>
                            setExpenseEditors((current) => ({
                              ...current,
                              [expense.id]: { ...editor, description: event.target.value },
                            }))
                          }
                        />
                      </div>

                      <div className="flex gap-2 md:col-span-2">
                        <Button
                          type="button"
                          onClick={() => handleSaveExpense(expense.id)}
                          disabled={
                            updateExpenseMutation.isPending ||
                            isMonthLocked(
                              finalizedMonths.find((item) => item.month === getMonthFromDate(editor.date)) ?? null
                            )
                          }
                        >
                          {updateExpenseMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                          <span>Save</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setExpenseEditors((current) => {
                              const next = { ...current };
                              delete next[expense.id];
                              return next;
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{expense.personName}</p>
                          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {expenseCategoryLabels[expense.category]}
                          </span>
                          <span className="text-sm text-muted-foreground">{formatDate(expense.date)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {expense.description?.trim() ? expense.description : "No description added."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-24 text-right font-semibold text-rose-600">
                          {formatMoney(expense.amount)}
                        </p>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() =>
                            setExpenseEditors((current) => ({
                              ...current,
                              [expense.id]: mapExpenseToEditor(expense),
                            }))
                          }
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="destructive"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          disabled={
                            deleteExpenseMutation.isPending ||
                            isMonthLocked(finalizedMonths.find((item) => item.month === expense.month) ?? null)
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <SectionEmptyState label={`No expenses have been recorded for ${formatMonthLabel(selectedMonth)}.`} />
          )}

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-background px-4 py-3">
            <div>
              <p className="font-medium text-foreground">Net Balacne for {formatMonthLabel(selectedMonth)}</p>
              <p className="text-sm text-muted-foreground">Deposits minus expenses for the selected month.</p>
            </div>
            <p className={cn("text-lg font-semibold", netMonthChange >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {formatMoney(netMonthChange)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
