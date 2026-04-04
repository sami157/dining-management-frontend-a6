export type NumberLike = string | number;

export type ExpenseCategory = "GAS" | "TRANSPORT" | "BAZAR" | "OTHER";

export type DepositUserPreview = {
  id: string;
  name: string;
  email?: string | null;
};

export type Deposit = {
  id: string;
  userId: string;
  amount: NumberLike;
  recordedById: string;
  month: string;
  note?: string | null;
  date: string;
  createdAt: string;
  updatedAt?: string;
  user?: DepositUserPreview | null;
};

export type Expense = {
  id: string;
  date: string;
  amount: NumberLike;
  category: ExpenseCategory;
  personName: string;
  description?: string | null;
  loggedById: string;
  month: string;
  createdAt: string;
  updatedAt?: string;
};

export type FinalizedMonth = {
  id?: string;
  month: string;
  totalDeposit?: NumberLike | null;
  totalExpense?: NumberLike | null;
  mealRate?: NumberLike | null;
  finalizedAt?: string | null;
  finalizedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
