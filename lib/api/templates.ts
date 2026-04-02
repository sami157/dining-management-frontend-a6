'use client'

import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type { DayOfWeek, MealType, WeeklyMealTemplate } from "@/lib/types/meal";

type UpdateWeeklyMealTemplatePayload = {
  dayOfWeek: DayOfWeek;
  meals: MealType[];
};

export const getWeeklyMealTemplates = async () => {
  const response = await api.get<ApiSuccessResponse<WeeklyMealTemplate[]>>(apiRoutes.templates.root);

  return response.data.data;
};

export const updateWeeklyMealTemplate = async (
  payload: UpdateWeeklyMealTemplatePayload
) => {
  const response = await api.patch<ApiSuccessResponse<WeeklyMealTemplate>>(
    apiRoutes.templates.root,
    payload
  );

  return response.data.data;
};
