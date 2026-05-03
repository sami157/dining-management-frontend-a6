'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, SunMoon, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDashboardRoute } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

const guestLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

const sharedSignedInLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
];

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "User";
  const parts = source.split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, appUser, logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const hasAdminDashboardAccess =
    appUser?.role === "ADMIN" || appUser?.role === "MANAGER";

  const links = user
    ? [
        ...sharedSignedInLinks,
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
  const dashboardRoute = getDashboardRoute(appUser?.role);
  const displayName = appUser?.name ?? user?.displayName ?? "Dining User";
  const displayEmail = appUser?.email ?? user?.email ?? "";

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

          {user ? (
            <Popover open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="cursor-pointer gap-2 rounded-full px-2 pr-3 hover:border-primary/40 hover:bg-primary/10"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {getInitials(displayName, displayEmail)}
                  </span>
                  <span className="hidden max-w-28 truncate text-sm sm:block">
                    {displayName}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(displayName, displayEmail)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{displayName}</p>
                      {displayEmail ? (
                        <p className="truncate text-sm text-muted-foreground">{displayEmail}</p>
                      ) : null}
                    </div>
                  </div>
                  {appUser?.role ? (
                    <p className="mt-3 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {appUser.role}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1 p-2">
                  <Button
                    variant="ghost"
                    className="cursor-pointer justify-start gap-2 hover:bg-primary/10 hover:text-primary"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push("/user-profile");
                    }}
                  >
                    <UserRound className="size-4" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="cursor-pointer justify-start gap-2 hover:bg-primary/10 hover:text-primary"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      router.push(dashboardRoute);
                    }}
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="cursor-pointer justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={async () => {
                      setProfileMenuOpen(false);
                      await logOut();
                      router.replace("/");
                    }}
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Button onClick={() => router.push("/login")}>Login</Button>
          )}
        </div>
      </div>
    </header>
  );
}
