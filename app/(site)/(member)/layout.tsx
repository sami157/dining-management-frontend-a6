import type { ReactNode } from "react";
import { AuthProtectedRoute } from "@/components/auth/protected-route";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return <AuthProtectedRoute>{children}</AuthProtectedRoute>;
}
