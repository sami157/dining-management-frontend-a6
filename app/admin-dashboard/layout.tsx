import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
      <div className="flex flex-1 flex-col bg-zinc-100 lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
