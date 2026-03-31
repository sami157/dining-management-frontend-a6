import type { UserRole } from "@/lib/types/app-user";

export function getDashboardRoute(role?: UserRole | null) {
  if (role === "ADMIN" || role === "MANAGER") {
    return "/admin-dashboard";
  }

  return "/user-dashboard";
}
