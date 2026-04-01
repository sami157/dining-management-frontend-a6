'use client'

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/loading-state";
import { getDashboardRoute } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/types/app-user";
import { useAuth } from "@/providers/AuthProvider";

type AuthProtectedRouteProps = {
  children: ReactNode;
};

type RoleProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: UserRole[];
};

export function AuthProtectedRoute({ children }: AuthProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, user]);

  if (loading) {
    return <LoadingState label="Checking access..." />;
  }

  if (!user) {
    return <LoadingState label="Redirecting to login..." />;
  }

  return <>{children}</>;
}

export function RoleProtectedRoute({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, appUser, loading, appUserLoading, appUserResolved } = useAuth();

  useEffect(() => {
    if (loading || appUserLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!role) {
      router.replace("/");
      return;
    }

    if (!allowedRoles.includes(role)) {
      router.replace(getDashboardRoute(role));
    }
  }, [allowedRoles, appUserLoading, loading, pathname, role, router, user]);

  if (loading || appUserLoading) {
    return <LoadingState label="Checking access..." />;
  }

  if (!user) {
    return <LoadingState label="Redirecting to login..." />;
  }

  if (!role && appUserResolved) {
    return <LoadingState label="We couldn't verify your access." />;
  }

  if (!appUser) {
    return <LoadingState label="Resolving your profile..." />;
  }

  if (!allowedRoles.includes(role!)) {
    return <LoadingState label="Redirecting to your dashboard..." />;
  }

  return <>{children}</>;
}
