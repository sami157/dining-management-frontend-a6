'use client'

import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type { MealDeadline, MealType } from "@/lib/types/meal";

export const getMealDeadlines = async () => {
  const response = await api.get<ApiSuccessResponse<MealDeadline[]>>(apiRoutes.deadlines.root);

  return response.data.data;
};

type UpsertMealDeadlinePayload = {
  type: MealType;
  time: string;
  offsetDays: number;
};

type UpdateMealDeadlinePayload = {
  time: string;
  offsetDays: number;
};

export const createMealDeadline = async (payload: UpsertMealDeadlinePayload) => {
  const response = await api.post<ApiSuccessResponse<MealDeadline>>(apiRoutes.deadlines.root, payload);

  return response.data.data;
};

export const updateMealDeadline = async (
  mealType: MealType,
  payload: UpdateMealDeadlinePayload
) => {
  const response = await api.patch<ApiSuccessResponse<MealDeadline>>(
    `${apiRoutes.deadlines.root}/${mealType}`,
    payload
  );

  return response.data.data;
};
