export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export type DayOfWeek =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export type MealDeadline = {
  id: string;
  type: MealType;
  time: string;
  offsetDays: number;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledMeal = {
  id: string;
  scheduleId: string;
  type: MealType;
  isAvailable: boolean;
  weight: string | number;
  menu?: string | null;
  updatedAt: string;
};

export type MealSchedule = {
  id: string;
  date: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  meals: ScheduledMeal[];
};

export type MealRegistration = {
  id: string;
  scheduledMealId: string;
  userId: string;
  count: number;
  registeredById: string;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyMealTemplate = {
  id: string;
  dayOfWeek: DayOfWeek;
  meals: MealType[];
  createdAt: string;
  updatedAt: string;
};
