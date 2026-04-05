'use client'

import { isAxiosError } from "axios";
import type { User } from "firebase/auth";
import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import { getAuthHeader } from "@/lib/auth/get-auth-header";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/api/types";
import type { AppUser } from "@/lib/types/app-user";

export type RegisterAppUserPayload = {
  firebaseUid: string;
  name: string;
  email: string;
  mobile?: string;
  profileImage?: string;
};

export async function registerAppUser(
  payload: RegisterAppUserPayload,
  firebaseUser?: User | null
) {
  const authHeader = await getAuthHeader(firebaseUser);
  const response = await api.post<ApiSuccessResponse<AppUser>>(
    apiRoutes.auth.register,
    payload,
    {
      headers: authHeader ?? undefined,
      suppressAuthToast: true,
    }
  );

  return response.data.data;
}

export async function getCurrentAppUser(firebaseUser?: User | null) {
  const authHeader = await getAuthHeader(firebaseUser);
  const response = await api.get<ApiSuccessResponse<AppUser>>(apiRoutes.users.me, {
    headers: authHeader ?? undefined,
    suppressAuthToast: true,
  });

  return response.data.data;
}

function extractApiErrorMessage(error: unknown) {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return "";
  }

  return (
    error.response?.data?.errorSources?.[0]?.message ??
    error.response?.data?.message ??
    error.message ??
    ""
  ).toLowerCase();
}

export function isNotFoundError(error: unknown) {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return false;
  }

  if (error.response?.status === 404) {
    return true;
  }

  const message = extractApiErrorMessage(error);

  return (
    message.includes("user does not exist") ||
    message.includes("does not exist in the database") ||
    message.includes("user is not registered in the system") ||
    message.includes("not registered in the system") ||
    message.includes("not found")
  );
}
