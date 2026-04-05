'use client'

import Link from "next/link";
import {
  ChartNoAxesCombined,
  CookingPot,
  HandCoins,
  History,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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
  const canOpenMemberDashboard =
    appUser?.role === "ADMIN" || appUser?.role === "MANAGER";
  const links = appUser?.role === "ADMIN" ? [...adminLinks, ...adminOnlyLinks] : adminLinks;

  return (
    <aside className="flex w-full flex-col border-b border-border bg-card/92 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="space-y-2 border-b border-border px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Control Center
        </p>
        <h2 className="title-font text-2xl text-foreground">Manager Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as {appUser?.name ?? "User"} ({appUser?.role ?? "Unknown"})
        </p>
        <div className="flex gap-8">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
            Home
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={async () => {
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
            onClick={() => router.push("/user-dashboard")}
          >
            Open My Dashboard
          </Button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-4 py-5">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
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
    </aside>
  );
}
