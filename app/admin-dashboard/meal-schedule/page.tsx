'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChartColumnIncreasing,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  addScheduledMeal,
  createSchedule,
  deleteSchedule,
  deleteScheduledMeal,
  generateSchedules,
  getSchedules,
  updateScheduledMeal,
} from "@/lib/api/schedules";
import { getDailyStats as fetchDailyStats } from "@/lib/api/stats";
import type { MealType, MealSchedule, ScheduledMeal } from "@/lib/types/meal";
import type { DailyMealTypeStats } from "@/lib/types/stats";

const mealTypeOptions: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

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
  month: "short",
  day: "numeric",
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

const formatScheduleDate = (dateString: string) => {
  const date = parseScheduleDate(dateString);

  if (!date) {
    return dateString || "Unknown date";
  }

  return `${weekdayFormatter.format(date)}, ${dateFormatter.format(date)}`;
};
const getScheduleDateKey = (dateString: string) => {
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

type CreateMealDraft = {
  type: MealType;
  enabled: boolean;
  weight: string;
  menu: string;
};

type MealEditorState = {
  weight: string;
  menu: string;
  isAvailable: boolean;
};

type AddMealDraft = {
  type: MealType;
  weight: string;
  menu: string;
  isAvailable: boolean;
};

const createDefaultMealDrafts = (): CreateMealDraft[] =>
  mealTypeOptions.map((type) => ({
    type,
    enabled: type !== "DINNER",
    weight: "1",
    menu: "",
  }));

const mapMealToEditor = (meal: ScheduledMeal): MealEditorState => ({
  weight: String(meal.weight),
  menu: meal.menu ?? "",
  isAvailable: meal.isAvailable,
});

const dailyMealTypeLabels: Record<DailyMealTypeStats["type"], string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

const MealSchedulePage = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [newScheduleDate, setNewScheduleDate] = useState(getDhakaToday);
  const [createMealDrafts, setCreateMealDrafts] = useState<CreateMealDraft[]>(createDefaultMealDrafts);
  const [mealEditors, setMealEditors] = useState<Record<string, MealEditorState>>({});
  const [addMealDrafts, setAddMealDrafts] = useState<Record<string, AddMealDraft>>({});

  const schedulesQuery = useQuery({
    queryKey: ["admin-schedules", selectedMonth],
    queryFn: () => getSchedules({ month: selectedMonth }),
  });
  const dailyStatsQuery = useQuery({
    queryKey: ["stats", "daily", newScheduleDate],
    queryFn: () => fetchDailyStats(newScheduleDate),
  });

  const syncSchedules = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-schedules", selectedMonth] });
    await queryClient.invalidateQueries({ queryKey: ["stats", "daily"] });
  };

  const createScheduleMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: async () => {
      await syncSchedules();
      setNewScheduleDate(getDhakaToday());
      setCreateMealDrafts(createDefaultMealDrafts());
      toast.success("Schedule created.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create schedule.");
    },
  });

  const generateMonthMutation = useMutation({
    mutationFn: generateSchedules,
    onSuccess: async () => {
      await syncSchedules();
      toast.success("Month schedules generated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to generate schedules.");
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: ({
      scheduleId,
      mealType,
      payload,
    }: {
      scheduleId: string;
      mealType: MealType;
      payload: {
        weight: number;
        menu?: string;
        isAvailable: boolean;
      };
    }) => updateScheduledMeal(scheduleId, mealType, payload),
    onSuccess: async (_, variables) => {
      await syncSchedules();
      setMealEditors((current) => {
        const next = { ...current };
        delete next[`${variables.scheduleId}:${variables.mealType}`];
        return next;
      });
      toast.success("Meal updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update meal.");
    },
  });

  const addMealMutation = useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: {
        type: MealType;
        weight: number;
        menu?: string;
        isAvailable: boolean;
      };
    }) => addScheduledMeal(scheduleId, payload),
    onSuccess: async (_, variables) => {
      await syncSchedules();
      setAddMealDrafts((current) => {
        const next = { ...current };
        delete next[variables.scheduleId];
        return next;
      });
      toast.success("Meal added.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add meal.");
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: ({ scheduleId, mealType }: { scheduleId: string; mealType: MealType }) =>
      deleteScheduledMeal(scheduleId, mealType),
    onSuccess: async () => {
      await syncSchedules();
      toast.success("Meal removed.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove meal.");
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: async (_, scheduleId) => {
      await syncSchedules();
      setAddMealDrafts((current) => {
        const next = { ...current };
        delete next[scheduleId];
        return next;
      });
      toast.success("Schedule deleted.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete schedule.");
    },
  });

  const schedules = useMemo(
    () =>
      [...(schedulesQuery.data ?? [])].sort((left, right) =>
        getScheduleDateKey(left.date).localeCompare(getScheduleDateKey(right.date))
      ),
    [schedulesQuery.data]
  );

  const handleCreateMealDraftChange = <K extends keyof CreateMealDraft>(
    mealType: MealType,
    field: K,
    value: CreateMealDraft[K]
  ) => {
    setCreateMealDrafts((current) =>
      current.map((draft) =>
        draft.type === mealType ? { ...draft, [field]: value } : draft
      )
    );
  };

  const handleCreateSchedule = async () => {
    const meals = createMealDrafts
      .filter((draft) => draft.enabled)
      .map((draft) => ({
        type: draft.type,
        weight: Number(draft.weight),
        menu: draft.menu.trim(),
        isAvailable: true,
      }))
      .filter((draft) => Number.isFinite(draft.weight) && draft.weight > 0);

    if (!newScheduleDate) {
      toast.error("Select a Dhaka date for the schedule.");
      return;
    }

    if (!meals.length) {
      toast.error("Enable at least one meal before creating a schedule.");
      return;
    }

    await createScheduleMutation.mutateAsync({
      date: newScheduleDate,
      meals: meals.map((meal) => ({
        ...meal,
        ...(meal.menu ? { menu: meal.menu } : {}),
      })),
    });
  };

  const handleGenerateMonth = async () => {
    await generateMonthMutation.mutateAsync({ month: selectedMonth });
  };

  const handleMealEditorChange = <K extends keyof MealEditorState>(
    scheduleId: string,
    mealType: MealType,
    field: K,
    value: MealEditorState[K]
  ) => {
    const key = `${scheduleId}:${mealType}`;

    setMealEditors((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? { weight: "1", menu: "", isAvailable: true }),
        [field]: value,
      },
    }));
  };

  const handleSaveMeal = async (scheduleId: string, meal: ScheduledMeal) => {
    const key = `${scheduleId}:${meal.type}`;
    const draft = mealEditors[key] ?? mapMealToEditor(meal);
    const weight = Number(draft.weight);

    if (!Number.isFinite(weight) || weight <= 0) {
      toast.error("Weight must be a number greater than zero.");
      return;
    }

    await updateMealMutation.mutateAsync({
      scheduleId,
      mealType: meal.type,
      payload: {
        weight,
        isAvailable: draft.isAvailable,
        ...(draft.menu.trim() ? { menu: draft.menu.trim() } : { menu: "" }),
      },
    });
  };

  const handleDeleteMeal = async (scheduleId: string, mealType: MealType) => {
    await deleteMealMutation.mutateAsync({ scheduleId, mealType });
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    await deleteScheduleMutation.mutateAsync(scheduleId);
  };

  const handleAddMealDraftChange = <K extends keyof AddMealDraft>(
    scheduleId: string,
    field: K,
    value: AddMealDraft[K]
  ) => {
    setAddMealDrafts((current) => ({
      ...current,
      [scheduleId]: {
        ...(current[scheduleId] ?? {
          type: "DINNER",
          weight: "1",
          menu: "",
          isAvailable: true,
        }),
        [field]: value,
      },
    }));
  };

  const handleAddMeal = async (schedule: MealSchedule) => {
    const existingTypes = new Set(schedule.meals.map((meal) => meal.type));
    const defaultType = mealTypeOptions.find((type) => !existingTypes.has(type));
    const draft = addMealDrafts[schedule.id] ?? {
      type: defaultType ?? "DINNER",
      weight: "1",
      menu: "",
      isAvailable: true,
    };
    const weight = Number(draft.weight);

    if (existingTypes.has(draft.type)) {
      toast.error("That meal type already exists on this schedule.");
      return;
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      toast.error("Weight must be a number greater than zero.");
      return;
    }

    await addMealMutation.mutateAsync({
      scheduleId: schedule.id,
      payload: {
        type: draft.type,
        weight,
        isAvailable: draft.isAvailable,
        ...(draft.menu.trim() ? { menu: draft.menu.trim() } : {}),
      },
    });
  };

  if (schedulesQuery.isPending || dailyStatsQuery.isPending) {
    return <LoadingState label="Loading meal schedules..." />;
  }

  if (schedulesQuery.isError || dailyStatsQuery.isError) {
    return <LoadingState label="We couldn't load the meal schedules." />;
  }

  const dailyStats = dailyStatsQuery.data;

  return (
    <div className="space-y-8 mx-auto max-w-5xl">
      <PageIntro
        eyebrow="Manager"
        title="Meal Schedule Control"
        description="Manage meal schedules for each day of the month. Create new schedules, backfill from templates, and edit or delete existing ones as needed."
      />

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5" />
                <span>Generate Schedule(s)</span>
              </div>
              <Button
                type="button"
                onClick={handleCreateSchedule}
                disabled={createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? <Spinner className="size-4" /> : <Plus />}
                <span>Generate Day</span>
              </Button>
            </CardTitle>
            <CardDescription>
              <div className="flex items-center justify-between">
                <p>
                  Use this when you need to add or repair a specific date manually.
                </p>
                <Button
                  type="button"
                  onClick={handleGenerateMonth}
                  disabled={generateMonthMutation.isPending}
                >
                  {generateMonthMutation.isPending ? <Spinner className="size-4" /> : <Sparkles />}
                  <span>Generate Full Month</span>
                </Button>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center md:flex-row gap-4 justify-between">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Calendar
                className="rounded-2xl border p-4"
                mode="single"
                month={monthKeyToDate(selectedMonth)}
                captionLayout="dropdown"
                selected={dateKeyToDate(newScheduleDate)}
                onMonthChange={(date) => {
                  setSelectedMonth(dateToDateKey(date).slice(0, 7));
                }}
                onSelect={(date) => {
                  if (!date) {
                    return;
                  }

                  const nextDateKey = dateToDateKey(date);
                  setNewScheduleDate(nextDateKey);
                  setSelectedMonth(nextDateKey.slice(0, 7));
                }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {createMealDrafts.map((draft) => (
                <div
                  key={draft.type}
                  className="rounded-[calc(var(--radius)+0.25rem)] border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{mealTypeLabels[draft.type]}</p>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={draft.enabled}
                        onChange={(event) =>
                          handleCreateMealDraftChange(draft.type, "enabled", event.target.checked)
                        }
                      />
                      <span>Include</span>
                    </label>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor={`weight-${draft.type}`}>Weight</Label>
                      <Input
                        id={`weight-${draft.type}`}
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={draft.weight}
                        onChange={(event) =>
                          handleCreateMealDraftChange(draft.type, "weight", event.target.value)
                        }
                        disabled={!draft.enabled}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`menu-${draft.type}`}>Menu</Label>
                      <Input
                        id={`menu-${draft.type}`}
                        placeholder=""
                        value={draft.menu}
                        onChange={(event) =>
                          handleCreateMealDraftChange(draft.type, "menu", event.target.value)
                        }
                        disabled={!draft.enabled}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartColumnIncreasing className="size-5" />
            <span>Daily analytics for {newScheduleDate}</span>
          </CardTitle>
          <CardDescription>
            Aggregated totals from `/stats/daily`. Days without a schedule still return zero and stay visible here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[calc(var(--radius)+0.25rem)] bg-muted p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meals registered</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{dailyStats.meals.totalMealsRegistered}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dailyStats.meals.totalRegistrations} registrations</p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.25rem)] bg-muted p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Weighted meals</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{dailyStats.meals.totalWeightedMeals}</p>
              <p className="mt-1 text-sm text-muted-foreground">Operational weighted total</p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.25rem)] bg-muted p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Available meal count</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{dailyStats.meals.availableMealCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Configured meals for that date</p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.25rem)] bg-muted p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Schedule state</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {dailyStats.hasSchedule ? "Scheduled" : "No schedule"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Zero totals are valid when a day is empty</p>
            </div>
          </div>

          {dailyStats.meals.byType.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {dailyStats.meals.byType.map((meal) => (
                <div key={meal.type} className="rounded-[calc(var(--radius)+0.25rem)] border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{dailyMealTypeLabels[meal.type]}</p>
                    <span className="text-sm text-muted-foreground">Weight {meal.weight}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>{meal.totalRegistrations} registrations</p>
                    <p>{meal.totalMealsRegistered} meals registered</p>
                    <p>{meal.totalWeightedMeals} weighted meals</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[calc(var(--radius)+0.25rem)] border border-dashed bg-muted/20 p-8 text-sm text-muted-foreground">
              No meals are configured for {newScheduleDate} yet. You can keep using this panel as a zero-state analytics view.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedules For {selectedMonth}</CardTitle>
          <CardDescription>
            Edit meal weight, availability, and menu inline. Delete empty or mistaken schedule dates when needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length ? (
            <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
              {schedules.map((schedule) => {
                const existingTypes = new Set(schedule.meals.map((meal) => meal.type));
                const availableMealTypes = mealTypeOptions.filter((type) => !existingTypes.has(type));
                const addDraft = addMealDrafts[schedule.id] ?? {
                  type: availableMealTypes[0] ?? "DINNER",
                  weight: "1",
                  menu: "",
                  isAvailable: true,
                };

                return (
                  <div
                    key={schedule.id}
                    className="flex h-full flex-col space-y-5 rounded-[calc(var(--radius)+0.5rem)] bg-card p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {formatScheduleDate(schedule.date)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {schedule.meals.length} configured meal
                          {schedule.meals.length === 1 ? "" : "s"} for this date.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        disabled={deleteScheduleMutation.isPending}
                      >
                        {deleteScheduleMutation.isPending ? (
                          <Spinner className="size-4" />
                        ) : (
                          <Trash2 />
                        )}
                        <span>Delete day</span>
                      </Button>
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                      {schedule.meals
                        .slice()
                        .sort(
                          (left, right) =>
                            mealTypeOptions.indexOf(left.type) - mealTypeOptions.indexOf(right.type)
                        )
                        .map((meal) => {
                          const editorKey = `${schedule.id}:${meal.type}`;
                          const editor = mealEditors[editorKey] ?? mapMealToEditor(meal);

                          return (
                            <div
                              key={meal.id}
                              className="rounded-[calc(var(--radius)+0.25rem)] bg-muted p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <p className="flex items-center gap-2 font-semibold text-foreground">
                                    <UtensilsCrossed className="size-4" />
                                    <span>{mealTypeLabels[meal.type]}</span>
                                  </p>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteMeal(schedule.id, meal.type)}
                                  disabled={deleteMealMutation.isPending}
                                  className="text-destructive hover:text-destructive"
                                  aria-label={`Remove ${mealTypeLabels[meal.type]} meal`}
                                >
                                  {deleteMealMutation.isPending ? (
                                    <Spinner className="size-4" />
                                  ) : (
                                    <Trash2 />
                                  )}
                                </Button>
                              </div>

                              <div className="mt-4 grid gap-4 sm:grid-cols-[0.28fr_0.72fr]">
                                <div className="space-y-1">
                                  <Label htmlFor={`${editorKey}-weight`}>Weight</Label>
                                  <Input
                                    id={`${editorKey}-weight`}
                                    type="number"
                                    min="0.25"
                                    step="0.25"
                                    value={editor.weight}
                                    onChange={(event) =>
                                      handleMealEditorChange(
                                        schedule.id,
                                        meal.type,
                                        "weight",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1 sm:min-w-0">
                                  <Label htmlFor={`${editorKey}-menu`}>Menu</Label>
                                  <Input
                                    id={`${editorKey}-menu`}
                                    placeholder=""
                                    value={editor.menu}
                                    onChange={(event) =>
                                      handleMealEditorChange(
                                        schedule.id,
                                        meal.type,
                                        "menu",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div className="mt-4 flex justify-end">
                                <Button
                                  type="button"
                                  onClick={() => handleSaveMeal(schedule.id, meal)}
                                  disabled={updateMealMutation.isPending}
                                >
                                  {updateMealMutation.isPending ? (
                                    <Spinner className="size-4" />
                                  ) : (
                                    <Save />
                                  )}
                                  <span>Save</span>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {availableMealTypes.length ? (
                      <div className="rounded-[calc(var(--radius)+0.25rem)] border border-dashed bg-card p-4">
                        <div className="flex flex-wrap items-end gap-4">
                          <div className="space-y-1">
                            <Label htmlFor={`${schedule.id}-new-type`}>Missing meal</Label>
                            <Select
                              value={addDraft.type}
                              onValueChange={(value) =>
                                handleAddMealDraftChange(
                                  schedule.id,
                                  "type",
                                  value as MealType
                                )
                              }
                            >
                              <SelectTrigger id={`${schedule.id}-new-type`}>
                                <SelectValue>{mealTypeLabels[addDraft.type]}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {availableMealTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {mealTypeLabels[type]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`${schedule.id}-new-weight`}>Weight</Label>
                            <Input
                              id={`${schedule.id}-new-weight`}
                              type="number"
                              min="0.25"
                              step="0.25"
                              value={addDraft.weight}
                              onChange={(event) =>
                                handleAddMealDraftChange(schedule.id, "weight", event.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`${schedule.id}-new-menu`}>Menu</Label>
                            <Input
                              id={`${schedule.id}-new-menu`}
                              placeholder=""
                              value={addDraft.menu}
                              onChange={(event) =>
                                handleAddMealDraftChange(schedule.id, "menu", event.target.value)
                              }
                            />
                          </div>

                          <label className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={addDraft.isAvailable}
                              onChange={(event) =>
                                handleAddMealDraftChange(
                                  schedule.id,
                                  "isAvailable",
                                  event.target.checked
                                )
                              }
                            />
                            <span>Available</span>
                          </label>

                          <Button
                            type="button"
                            onClick={() => handleAddMeal(schedule)}
                            disabled={addMealMutation.isPending}
                          >
                            {addMealMutation.isPending ? (
                              <Spinner className="size-4" />
                            ) : (
                              <Plus />
                            )}
                            <span>Add Meal</span>
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[calc(var(--radius)+0.25rem)] border border-dashed bg-muted/20 p-8 text-sm text-muted-foreground">
              No schedules found for {selectedMonth}. Generate the month or create a day manually.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MealSchedulePage;
