'use client'

export const queryKeys = {
  currentUser: ["current-user"] as const,
  mealDeadlines: ["meal-deadlines"] as const,
  myRegistrations: ["my-registrations"] as const,
  upcomingSchedules: (monthKeys: string[]) => ["upcoming-schedules", ...monthKeys] as const,
};
