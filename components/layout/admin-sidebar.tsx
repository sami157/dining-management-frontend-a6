'use client'

import Link from "next/link";
import {
  ChartNoAxesCombined,
  ChevronLeft,
  CookingPot,
  HandCoins,
  History,
  Menu,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const adminLinks = [
  { href: "/admin-dashboard", label: "Overview", icon: ChartNoAxesCombined },
  { href: "/admin-dashboard/configuration", label: "Configuration", icon: Settings2 },
  { href: "/admin-dashboard/meal-schedule", label: "Meal Schedule", icon: CookingPot },
  { href: "/admin-dashboard/fund-management", label: "Fund Management", icon: HandCoins },
  { href: "/admin-dashboard/member-management", label: "Registration Management", icon: Users },
  { href: "/admin-dashboard/history", label: "History", icon: History },
];
const adminOnlyLinks = [
  { href: "/admin-dashboard/admin-actions", label: "Admin Actions", icon: ShieldCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser, logOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const canOpenMemberDashboard =
    appUser?.role === "ADMIN" || appUser?.role === "MANAGER";
  const links = appUser?.role === "ADMIN" ? [...adminLinks, ...adminOnlyLinks] : adminLinks;

  const SidebarContent = (
    <>
      <div className="space-y-2 border-b border-border px-6 py-6">
        <div className="flex items-start justify-between gap-3 lg:block">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Control Center
            </p>
            <h2 className="title-font text-2xl text-foreground">Manager Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Signed in as {appUser?.name ?? "User"} ({appUser?.role ?? "Unknown"})
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setMobileOpen(false);
              router.push("/");
            }}
          >
            Home
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={async () => {
              setMobileOpen(false);
              await logOut();
              router.replace("/login");
            }}
          >
            Logout
          </Button>
        </div>
        {canOpenMemberDashboard ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setMobileOpen(false);
              router.push("/user-dashboard");
            }}
          >
            Open My Dashboard
          </Button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-4 py-5">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/72 hover:bg-secondary/45"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <div className="border-b border-border bg-card/92 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Control Center
              </p>
              <p className="text-sm font-semibold text-foreground">Manager Dashboard</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            Home
          </Button>
        </div>
      </div>

      <aside className="hidden lg:flex lg:min-h-screen lg:w-72 lg:flex-col lg:border-r lg:border-border lg:bg-card/92">
        {SidebarContent}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/35 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu overlay"
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-[min(20rem,88vw)] flex-col border-r border-border bg-card shadow-xl transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {SidebarContent}
        </aside>
      </div>
    </>
  );
}
