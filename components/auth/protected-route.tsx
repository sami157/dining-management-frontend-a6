'use client'

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/loading-state";
import { getDashboardRoute } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/types/app-user";
import { useAuth } from "@/providers/AuthProvider";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, appUser, loading, appUserLoading } = useAuth();

  useEffect(() => {
    if (loading || appUserLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!appUser) {
      router.replace("/");
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.replace(getDashboardRoute(role));
    }
  }, [allowedRoles, appUser, appUserLoading, loading, pathname, role, router, user]);

  if (loading || appUserLoading) {
    return <LoadingState label="Checking access..." />;
  }

  if (!user) {
    return <LoadingState label="Redirecting to login..." />;
  }

  if (!appUser) {
    return <LoadingState label="Resolving your profile..." />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <LoadingState label="Redirecting to your dashboard..." />;
  }

  return <>{children}</>;
}
