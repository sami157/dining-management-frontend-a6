export type PublicStatsResponse = {
  asOfDate: string;
  month: string;
  community: {
    activeMembers: number;
    activeManagers: number;
  };
  meals: {
    totalRegistrations: number;
    totalMealsRegistered: number;
    totalWeightedMeals: number;
    scheduleCount: number;
  };
  finance: {
    totalDeposits: number;
    totalExpenses: number;
  };
  highlights: {
    topDepositor: {
      userId: string;
      name: string;
      totalAmount: number;
    } | null;
    topConsumer: {
      userId: string;
      name: string;
      totalMealsRegistered: number;
      totalWeightedMeals: number;
    } | null;
  };
  finalization: {
    isFinalized: boolean;
    finalizedAt: string | null;
    rolledBackAt: string | null;
    mealRate: number | null;
  };
};

export type OverviewStatsResponse = {
  asOfDate: string;
  currentMonth: string;
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  roles: {
    admins: number;
    managers: number;
    members: number;
    activeMembers: number;
  };
  finalization: {
    lockedMonths: number;
  };
};

export type ManagerSummary = {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  profileImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DailyMealTypeStats = {
  type: "BREAKFAST" | "LUNCH" | "DINNER";
  isAvailable: boolean;
  weight: number;
  totalRegistrations: number;
  totalMealsRegistered: number;
  totalWeightedMeals: number;
};

export type DailyStatsResponse = {
  date: string;
  hasSchedule: boolean;
  meals: {
    availableMealCount: number;
    totalRegistrations: number;
    totalMealsRegistered: number;
    totalWeightedMeals: number;
    byType: DailyMealTypeStats[];
  };
};

export type MonthlyStatsResponse = {
  month: string;
  deposits: {
    totalAmount: number;
    count: number;
    uniqueDepositors: number;
  };
  expenses: {
    totalAmount: number;
    count: number;
  };
  meals: {
    totalRegistrations: number;
    totalMealsRegistered: number;
    totalWeightedMeals: number;
    uniqueMembersWithRegistrations: number;
    scheduleCount: number;
    availableMealCount: number;
  };
  finalization:
    | {
        isFinalized: true;
        finalizedAt: string;
        rolledBackAt: string | null;
        mealRate: number;
        totalExpenses: number;
        totalWeightedMealCount: number;
      }
    | {
        isFinalized: false;
        finalizedAt: null;
        rolledBackAt: null;
        mealRate: null;
        totalExpenses: null;
        totalWeightedMealCount: null;
      };
};
