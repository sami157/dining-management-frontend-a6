'use client'

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { getAuthHeader } from "@/lib/auth/get-auth-header";
import type { ApiErrorResponse } from "@/lib/api/types";

declare module "axios" {
  interface AxiosRequestConfig {
    auth?: boolean;
  }

  interface InternalAxiosRequestConfig {
    auth?: boolean;
  }
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_API_BASE_URL");
}

const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!config.auth) {
      return config;
    }

    const authHeader = await getAuthHeader();

    config.headers.set("Authorization", authHeader.Authorization);

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed";

    if (status === 401) {
      toast.error("Your session is missing or expired. Please sign in again.");
    } else if (status === 403) {
      toast.error("You do not have permission to perform this action.");
    }

    error.message = message;

    return Promise.reject(error);
  }
);

export { api };
