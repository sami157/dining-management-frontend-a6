'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const adminLinks = [
  { href: "/admin-dashboard", label: "Overview" },
  { href: "/admin-dashboard/meal-schedule", label: "Meal Schedule" },
  { href: "/admin-dashboard/fund-management", label: "Fund Management" },
  { href: "/admin-dashboard/member-management", label: "Member Management" },
  { href: "/admin-dashboard/history", label: "History" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser, logOut } = useAuth();

  return (
    <aside className="flex w-full flex-col border-b border-zinc-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="space-y-2 border-b border-zinc-200 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Control Center
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950">Admin Dashboard</h2>
        <p className="text-sm text-zinc-600">
          Signed in as {appUser?.name ?? "User"} ({appUser?.role ?? "Unknown"})
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-4 py-5">
        {adminLinks.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex gap-3 px-4 py-4">
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
    </aside>
  );
}
