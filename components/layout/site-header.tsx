'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getDashboardRoute } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const guestLinks = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, appUser, logOut } = useAuth();

  const links = user
    ? [
        { href: "/", label: "Home" },
        {
          href: getDashboardRoute(appUser?.role),
          label:
            appUser?.role === "ADMIN" || appUser?.role === "MANAGER"
              ? "Dashboard"
              : "My Dashboard",
        },
        { href: "/user-profile", label: "Profile" },
      ]
    : guestLinks;

  return (
    <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Dining Management
          </span>
          <span className="text-lg font-semibold text-zinc-950">
            App Router Frontend
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition hover:bg-zinc-100",
                pathname === link.href ? "bg-zinc-950 text-white hover:bg-zinc-950" : "text-zinc-700"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {appUser ? (
            <div className="hidden rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 sm:block">
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
