export const apiRoutes = {
  auth: {
    register: "/auth/register",
  },
  users: {
    root: "/users",
    me: "/users/me",
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
  },
} as const;
