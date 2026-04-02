'use client'

import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type { MealSchedule, MealType, ScheduledMeal } from "@/lib/types/meal";

type GetSchedulesParams = {
  date?: string;
  month?: string;
};

type ScheduledMealInput = {
  type: MealType;
  isAvailable?: boolean;
  weight: number;
  menu?: string;
};

type CreateSchedulePayload = {
  date: string;
  meals: ScheduledMealInput[];
};

type GenerateSchedulesPayload = {
  month: string;
};

type UpdateScheduledMealPayload = {
  isAvailable?: boolean;
  weight?: number;
  menu?: string;
};

export const getSchedules = async (params: GetSchedulesParams = {}) => {
  const response = await api.get<ApiSuccessResponse<MealSchedule[]>>(apiRoutes.schedules.root, {
    params,
  });

  return response.data.data;
};

export const createSchedule = async (payload: CreateSchedulePayload) => {
  const response = await api.post<ApiSuccessResponse<MealSchedule>>(
    apiRoutes.schedules.root,
    payload
  );

  return response.data.data;
};

export const generateSchedules = async (payload: GenerateSchedulesPayload) => {
  const response = await api.post<ApiSuccessResponse<unknown>>(apiRoutes.schedules.generate, payload);

  return response.data.data;
};

export const addScheduledMeal = async (
  scheduleId: string,
  payload: ScheduledMealInput
) => {
  const response = await api.post<ApiSuccessResponse<ScheduledMeal>>(
    `${apiRoutes.schedules.root}/${scheduleId}/meals`,
    payload
  );

  return response.data.data;
};

export const updateScheduledMeal = async (
  scheduleId: string,
  mealType: MealType,
  payload: UpdateScheduledMealPayload
) => {
  const response = await api.patch<ApiSuccessResponse<ScheduledMeal>>(
    `${apiRoutes.schedules.root}/${scheduleId}/meals/${mealType}`,
    payload
  );

  return response.data.data;
};

export const deleteScheduledMeal = async (scheduleId: string, mealType: MealType) => {
  const response = await api.delete<ApiSuccessResponse<ScheduledMeal>>(
    `${apiRoutes.schedules.root}/${scheduleId}/meals/${mealType}`
  );

  return response.data.data;
};

export const deleteSchedule = async (scheduleId: string) => {
  const response = await api.delete<ApiSuccessResponse<MealSchedule>>(
    `${apiRoutes.schedules.root}/${scheduleId}`
  );

  return response.data.data;
};
