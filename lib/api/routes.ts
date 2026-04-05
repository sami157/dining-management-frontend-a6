export const apiRoutes = {
  auth: {
    register: "/auth/register",
  },
  stats: {
    public: "/stats/public",
    overview: "/stats/overview",
    managers: "/stats/managers",
    monthly: "/stats/monthly",
  },
  users: {
    root: "/users",
    me: "/users/me",
    role: (id: string) => `/users/${id}/role`,
  },
  templates: {
    root: "/templates",
  },
  schedules: {
    root: "/schedules",
    generate: "/schedules/generate",
  },
  registrations: {
    root: "/registrations",
  },
  deadlines: {
    root: "/deadlines",
  },
  deposits: {
    root: "/deposits",
    myTotal: "/deposits/my-total",
  },
  expenses: {
    root: "/expenses",
  },
  finalize: {
    root: "/finalize",
    rollback: (month: string) => `/finalize/${month}/rollback`,
  },
} as const;
