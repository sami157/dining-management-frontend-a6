import type { ReactNode } from "react";
import { RoleProtectedRoute } from "@/components/auth/protected-route";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
      <div className="bg-shell flex flex-1 flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </RoleProtectedRoute>
  );
}
