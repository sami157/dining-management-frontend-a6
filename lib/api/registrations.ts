'use client'

import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type { MealRegistration } from "@/lib/types/meal";

type CreateRegistrationPayload = {
  scheduledMealId: string;
  count: number;
  userId?: string;
};

type UpdateRegistrationPayload = {
  count: number;
};

export const getRegistrations = async (userId?: string) => {
  const response = await api.get<ApiSuccessResponse<MealRegistration[]>>(apiRoutes.registrations.root, {
    params: userId ? { userId } : undefined,
  });

  return response.data.data;
};

export const createRegistration = async (payload: CreateRegistrationPayload) => {
  const response = await api.post<ApiSuccessResponse<MealRegistration>>(
    apiRoutes.registrations.root,
    payload
  );

  return response.data.data;
};

export const updateRegistration = async (
  registrationId: string,
  payload: UpdateRegistrationPayload
) => {
  const response = await api.patch<ApiSuccessResponse<MealRegistration>>(
    `${apiRoutes.registrations.root}/${registrationId}`,
    payload
  );

  return response.data.data;
};

export const deleteRegistration = async (registrationId: string) => {
  const response = await api.delete<ApiSuccessResponse<MealRegistration>>(
    `${apiRoutes.registrations.root}/${registrationId}`
  );

  return response.data.data;
};
