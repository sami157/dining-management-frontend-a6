'use client'

import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type {
  ManagerSummary,
  MonthlyStatsResponse,
  OverviewStatsResponse,
  PublicStatsResponse,
} from "@/lib/types/stats";

export async function getPublicStats(month?: string) {
  const response = await api.get<ApiSuccessResponse<PublicStatsResponse>>(apiRoutes.stats.public, {
    params: month ? { month } : undefined,
    suppressAuthToast: true,
    skipAuth: true,
  });

  return response.data.data;
}

export async function getOverviewStats() {
  const response = await api.get<ApiSuccessResponse<OverviewStatsResponse>>(apiRoutes.stats.overview, {
    suppressAuthToast: true,
  });

  return response.data.data;
}

export async function getManagerStats() {
  const response = await api.get<ApiSuccessResponse<ManagerSummary[]>>(apiRoutes.stats.managers, {
    suppressAuthToast: true,
  });

  return response.data.data;
}

export async function getMonthlyStats(month: string) {
  const response = await api.get<ApiSuccessResponse<MonthlyStatsResponse>>(apiRoutes.stats.monthly, {
    params: { month },
    suppressAuthToast: true,
  });

  return response.data.data;
}
