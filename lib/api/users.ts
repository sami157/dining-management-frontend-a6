'use client'

import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type { AppUser, UserRole } from "@/lib/types/app-user";

export async function getUsers() {
  const response = await api.get<ApiSuccessResponse<AppUser[]>>(apiRoutes.users.root, {
    suppressAuthToast: true,
  });

  return response.data.data;
}

export type UpdateCurrentUserProfilePayload = {
  name: string;
  mobile?: string;
  profileImage?: string;
};

export type UpdateUserByIdPayload = {
  name?: string;
  email?: string;
  mobile?: string;
  profileImage?: string;
  isActive?: boolean;
};

export async function updateCurrentUserProfile(
  payload: UpdateCurrentUserProfilePayload
) {
  const response = await api.patch<ApiSuccessResponse<AppUser>>(apiRoutes.users.me, payload, {
    suppressAuthToast: true,
  });

  return response.data.data;
}

export async function updateUserRole(id: string, role: UserRole) {
  const response = await api.patch<ApiSuccessResponse<AppUser>>(
    apiRoutes.users.role(id),
    { role },
    {
      suppressAuthToast: true,
    }
  );

  return response.data.data;
}

export async function updateUserById(id: string, payload: UpdateUserByIdPayload) {
  const response = await api.patch<ApiSuccessResponse<AppUser>>(apiRoutes.users.byId(id), payload, {
    suppressAuthToast: true,
  });

  return response.data.data;
}

export async function deactivateUser(id: string) {
  const response = await api.delete<ApiSuccessResponse<AppUser>>(apiRoutes.users.byId(id), {
    suppressAuthToast: true,
  });

  return response.data.data;
}
