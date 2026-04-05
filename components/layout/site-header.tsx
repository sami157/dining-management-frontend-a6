'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardRoute } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

const guestLinks = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, appUser, logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const hasAdminDashboardAccess =
    appUser?.role === "ADMIN" || appUser?.role === "MANAGER";

  const links = user
    ? [
        { href: "/", label: "Home" },
        ...(hasAdminDashboardAccess
          ? [
              { href: "/admin-dashboard", label: "Manager Dashboard" },
              { href: "/user-dashboard", label: "My Dashboard" },
            ]
          : [
              {
                href: getDashboardRoute(appUser?.role),
                label:
                  appUser?.role === "ADMIN" || appUser?.role === "MANAGER"
                    ? "Dashboard"
                    : "My Dashboard",
              },
            ]),
        { href: "/user-profile", label: "Profile" },
      ]
    : guestLinks;

  return (
    <header className="sticky top-0 z-40 bg-background/10 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex flex-col">
          <span className="font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Dining
          </span>
          <span className="font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Management
          </span>
        </Link>

        <nav className="order-3 flex w-full flex-wrap items-center gap-2 md:order-2 md:w-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-full border border-transparent px-4 py-2 text-sm font-medium transition",
                pathname === link.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/72"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="order-2 flex items-center gap-3 md:order-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <SunMoon className="size-4" />
          </Button>

          {appUser ? (
            <div className="hidden rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
              {appUser.role}
            </div>
          ) : null}

          {user ? (
            <Button
              variant="outline"
              onClick={async () => {
                await logOut();
                router.replace("/");
              }}
            >
              Logout
            </Button>
          ) : (
            <Button onClick={() => router.push("/login")}>Login</Button>
          )}
        </div>
      </div>
    </header>
  );
}
