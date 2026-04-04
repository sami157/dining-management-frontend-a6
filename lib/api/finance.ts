'use client'

import { api } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type {
  Deposit,
  Expense,
  ExpenseCategory,
  FinalizedMonth,
  NumberLike,
} from "@/lib/types/finance";

export type GetDepositsParams = {
  userId?: string;
};

export type CreateDepositPayload = {
  userId: string;
  amount: number;
  month: string;
  note?: string;
  date?: string;
};

export type UpdateDepositPayload = Partial<CreateDepositPayload>;

export type GetExpensesParams = {
  month?: string;
};

export type CreateExpensePayload = {
  date?: string;
  amount: number;
  category: ExpenseCategory;
  personName: string;
  description?: string;
  month: string;
};

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export type FinalizeMonthPayload = {
  month: string;
};

export async function getDeposits(params?: GetDepositsParams) {
  const response = await api.get<ApiSuccessResponse<Deposit[]>>(apiRoutes.deposits.root, {
    params,
  });

  return response.data.data;
}

export async function getMyMonthlyDepositTotal(month: string) {
  const response = await api.get<ApiSuccessResponse<NumberLike>>(apiRoutes.deposits.myTotal, {
    params: { month },
  });

  return response.data.data;
}

export async function createDeposit(payload: CreateDepositPayload) {
  const response = await api.post<ApiSuccessResponse<Deposit>>(apiRoutes.deposits.root, payload);

  return response.data.data;
}

export async function updateDeposit(id: string, payload: UpdateDepositPayload) {
  const response = await api.patch<ApiSuccessResponse<Deposit>>(
    `${apiRoutes.deposits.root}/${id}`,
    payload
  );

  return response.data.data;
}

export async function deleteDeposit(id: string) {
  await api.delete(`${apiRoutes.deposits.root}/${id}`);
}

export async function getExpenses(params?: GetExpensesParams) {
  const response = await api.get<ApiSuccessResponse<Expense[]>>(apiRoutes.expenses.root, {
    params,
  });

  return response.data.data;
}

export async function createExpense(payload: CreateExpensePayload) {
  const response = await api.post<ApiSuccessResponse<Expense>>(apiRoutes.expenses.root, payload);

  return response.data.data;
}

export async function updateExpense(id: string, payload: UpdateExpensePayload) {
  const response = await api.patch<ApiSuccessResponse<Expense>>(
    `${apiRoutes.expenses.root}/${id}`,
    payload
  );

  return response.data.data;
}

export async function deleteExpense(id: string) {
  await api.delete(`${apiRoutes.expenses.root}/${id}`);
}

export async function getFinalizedMonths() {
  const response = await api.get<ApiSuccessResponse<FinalizedMonth[]>>(apiRoutes.finalize.root);

  return response.data.data;
}

export async function finalizeMonth(payload: FinalizeMonthPayload) {
  const response = await api.post<ApiSuccessResponse<FinalizedMonth>>(
    apiRoutes.finalize.root,
    payload
  );

  return response.data.data;
}
