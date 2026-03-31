'use client'

import { isAxiosError } from "axios";
import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type { AppUser } from "@/lib/types/app-user";

export type RegisterAppUserPayload = {
  firebaseUid: string;
  name: string;
  email: string;
  mobile?: string;
  profileImage?: string;
};

export async function registerAppUser(payload: RegisterAppUserPayload) {
  const response = await api.post<ApiSuccessResponse<AppUser>>(
    apiRoutes.auth.register,
    payload
  );

  return response.data.data;
}

export async function getCurrentAppUser() {
  const response = await api.get<ApiSuccessResponse<AppUser>>(apiRoutes.users.me, {
    auth: true,
  });

  return response.data.data;
}

export function isNotFoundError(error: unknown) {
  return isAxiosError(error) && error.response?.status === 404;
}
