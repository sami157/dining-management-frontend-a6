'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Save, Settings2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { createMealDeadline, getMealDeadlines, updateMealDeadline } from "@/lib/api/deadlines";
import { getWeeklyMealTemplates, updateWeeklyMealTemplate } from "@/lib/api/templates";
import { queryKeys } from "@/lib/query/keys";
import type { DayOfWeek, MealType } from "@/lib/types/meal";

const mealTypeOptions: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};
const dayOfWeekOrder: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const defaultDeadlineEditors: Record<MealType, { time: string; offsetDays: string }> = {
  BREAKFAST: { time: "22:00", offsetDays: "-1" },
  LUNCH: { time: "09:00", offsetDays: "0" },
  DINNER: { time: "15:00", offsetDays: "0" },
};
const defaultTemplateMeals: Record<DayOfWeek, MealType[]> = {
  SUNDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  MONDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  TUESDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  WEDNESDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  THURSDAY: ["BREAKFAST", "LUNCH", "DINNER"],
  FRIDAY: ["LUNCH", "DINNER"],
  SATURDAY: ["BREAKFAST", "LUNCH", "DINNER"],
};

type DeadlineEditorState = {
  time: string;
  offsetDays: string;
};

const ConfigurationPage = () => {
  const queryClient = useQueryClient();
  const [deadlineEditors, setDeadlineEditors] = useState<Partial<Record<MealType, DeadlineEditorState>>>({});
  const [templateEditors, setTemplateEditors] = useState<Partial<Record<DayOfWeek, MealType[]>>>({});

  const deadlinesQuery = useQuery({
    queryKey: queryKeys.mealDeadlines,
    queryFn: getMealDeadlines,
  });
  const templatesQuery = useQuery({
    queryKey: ["weekly-meal-templates"],
    queryFn: getWeeklyMealTemplates,
  });

  const saveDeadlineMutation = useMutation({
    mutationFn: async ({
      mealType,
      time,
      offsetDays,
      exists,
    }: {
      mealType: MealType;
      time: string;
      offsetDays: number;
      exists: boolean;
    }) => {
      if (exists) {
        return updateMealDeadline(mealType, { time, offsetDays });
      }

      return createMealDeadline({ type: mealType, time, offsetDays });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealDeadlines });
      toast.success("Deadline saved.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save deadline.");
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: updateWeeklyMealTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["weekly-meal-templates"] });
      toast.success("Meal template saved.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save meal template.");
    },
  });

  if (deadlinesQuery.isPending || templatesQuery.isPending) {
    return <LoadingState label="Loading configuration..." />;
  }

  if (deadlinesQuery.isError || templatesQuery.isError) {
    return <LoadingState label="We couldn't load the configuration." />;
  }

  const deadlineByType = new Map((deadlinesQuery.data ?? []).map((deadline) => [deadline.type, deadline]));
  const templateByDay = new Map((templatesQuery.data ?? []).map((template) => [template.dayOfWeek, template]));

  const handleDeadlineChange = <K extends keyof DeadlineEditorState>(
    mealType: MealType,
    field: K,
    value: DeadlineEditorState[K]
  ) => {
    setDeadlineEditors((current) => ({
      ...current,
      [mealType]: {
        ...(current[mealType] ?? {
          time: deadlineByType.get(mealType)?.time ?? defaultDeadlineEditors[mealType].time,
          offsetDays: deadlineByType.get(mealType)
            ? String(deadlineByType.get(mealType)?.offsetDays)
            : defaultDeadlineEditors[mealType].offsetDays,
        }),
        [field]: value,
      },
    }));
  };

  const handleSaveDeadline = async (mealType: MealType) => {
    const currentDeadline = deadlineByType.get(mealType);
    const draft = deadlineEditors[mealType] ?? {
      time: currentDeadline?.time ?? defaultDeadlineEditors[mealType].time,
      offsetDays: currentDeadline
        ? String(currentDeadline.offsetDays)
        : defaultDeadlineEditors[mealType].offsetDays,
    };
    const offsetDays = Number(draft.offsetDays);

    if (!draft.time) {
      toast.error("Deadline time is required.");
      return;
    }

    if (!Number.isInteger(offsetDays)) {
      toast.error("Offset days must be a whole number.");
      return;
    }

    await saveDeadlineMutation.mutateAsync({
      mealType,
      time: draft.time,
      offsetDays,
      exists: Boolean(currentDeadline),
    });
  };

  const handleTemplateToggle = (dayOfWeek: DayOfWeek, mealType: MealType) => {
    setTemplateEditors((current) => {
      const baseMeals =
        current[dayOfWeek] ??
        templateByDay.get(dayOfWeek)?.meals ??
        defaultTemplateMeals[dayOfWeek];
      const hasMeal = baseMeals.includes(mealType);
      const nextMeals = hasMeal
        ? baseMeals.filter((meal) => meal !== mealType)
        : [...baseMeals, mealType];

      return {
        ...current,
        [dayOfWeek]: mealTypeOptions.filter((meal) => nextMeals.includes(meal)),
      };
    });
  };

  const handleSaveTemplate = async (dayOfWeek: DayOfWeek) => {
    const meals =
      templateEditors[dayOfWeek] ??
      templateByDay.get(dayOfWeek)?.meals ??
      defaultTemplateMeals[dayOfWeek];

    await saveTemplateMutation.mutateAsync({ dayOfWeek, meals });
  };

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Manager"
        title="Configuration"
        description="Manage universal meal deadlines and the weekly meal template used to generate future schedules."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="size-5" />
              <span>Universal meal deadlines</span>
            </CardTitle>
            <CardDescription>These Dhaka-time cutoffs control when members can still book each meal type.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {mealTypeOptions.map((mealType) => {
              const deadline = deadlineByType.get(mealType);
              const editor = deadlineEditors[mealType] ?? {
                time: deadline?.time ?? defaultDeadlineEditors[mealType].time,
                offsetDays: deadline ? String(deadline.offsetDays) : defaultDeadlineEditors[mealType].offsetDays,
              };

              return (
                <div key={mealType} className="rounded-[calc(var(--radius)+0.25rem)] border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{mealTypeLabels[mealType]}</p>
                      <p className="text-sm text-muted-foreground">
                        {deadline ? `Current: ${deadline.time}, offset ${deadline.offsetDays}` : "No deadline saved yet."}
                      </p>
                    </div>
                    <Button type="button" onClick={() => handleSaveDeadline(mealType)} disabled={saveDeadlineMutation.isPending}>
                      {saveDeadlineMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                      <span>Save</span>
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`deadline-time-${mealType}`}>Time</Label>
                      <Input id={`deadline-time-${mealType}`} type="time" value={editor.time} onChange={(event) => handleDeadlineChange(mealType, "time", event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`deadline-offset-${mealType}`}>Offset days</Label>
                      <Input id={`deadline-offset-${mealType}`} type="number" step="1" value={editor.offsetDays} onChange={(event) => handleDeadlineChange(mealType, "offsetDays", event.target.value)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-5" />
              <span>Weekly meal template</span>
            </CardTitle>
            <CardDescription>Choose which meals should exist on each weekday when generating future schedules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {dayOfWeekOrder.map((dayOfWeek) => {
              const template = templateByDay.get(dayOfWeek);
              const selectedMeals = templateEditors[dayOfWeek] ?? template?.meals ?? defaultTemplateMeals[dayOfWeek];

              return (
                <div key={dayOfWeek} className="rounded-[calc(var(--radius)+0.25rem)] border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedMeals.length ? selectedMeals.map((meal) => mealTypeLabels[meal]).join(", ") : "No meals selected"}
                      </p>
                    </div>
                    <Button type="button" onClick={() => handleSaveTemplate(dayOfWeek)} disabled={saveTemplateMutation.isPending}>
                      {saveTemplateMutation.isPending ? <Spinner className="size-4" /> : <Save />}
                      <span>Save</span>
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4">
                    {mealTypeOptions.map((mealType) => (
                      <label key={mealType} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input type="checkbox" checked={selectedMeals.includes(mealType)} onChange={() => handleTemplateToggle(dayOfWeek, mealType)} />
                        <span>{mealTypeLabels[mealType]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigurationPage;
