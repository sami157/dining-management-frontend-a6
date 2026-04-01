'use client'

import { isAxiosError } from "axios";
import type { User } from "firebase/auth";
import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import { getAuthHeader } from "@/lib/auth/get-auth-header";
import type { ApiSuccessResponse } from "@/lib/api/types";
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

export function isNotFoundError(error: unknown) {
  return isAxiosError(error) && error.response?.status === 404;
}
