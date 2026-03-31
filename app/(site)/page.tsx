'use client'

import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, UtensilsCrossed, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardRoute } from "@/lib/auth/routes";
import { useAuth } from "@/providers/AuthProvider";

const features = [
  {
    title: "Meal Operations",
    description: "Manage schedules, deadlines, and registrations around Dhaka business dates.",
    icon: UtensilsCrossed,
  },
  {
    title: "Role-Based Access",
    description: "Keep member, manager, and admin flows separate without duplicating page shells.",
    icon: ShieldCheck,
  },
  {
    title: "Finance Tracking",
    description: "Prepare deposits, expenses, and finalization views behind the new route structure.",
    icon: Wallet,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, appUser } = useAuth();

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top,_#ffffff,_#f4f4f5_50%,_#e4e4e7)]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                Dining Management
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-zinc-950">
                App shell, auth sync, and role-aware routes are now the foundation.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-zinc-600">
                This scaffold follows the routing reference, keeps Firebase auth client-side,
                syncs authenticated users with the backend, and prepares protected sections
                for member and admin workflows.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button onClick={() => router.push(getDashboardRoute(appUser?.role))}>
                  Open dashboard
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <>
                  <Button onClick={() => router.push("/login")}>
                    Login
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/register")}>
                    Create account
                  </Button>
                </>
              )}
            </div>
          </div>

          <Card className="border-white/70 bg-white/90 shadow-xl shadow-zinc-300/35">
            <CardHeader>
              <CardTitle className="text-xl">Current foundation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-600">
              <p>Shared site shell and admin dashboard shell</p>
              <p>Firebase auth context with backend `/users/me` hydration</p>
              <p>Client guards for authenticated and role-restricted routes</p>
              <p>Axios client with Firebase bearer token injection</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="border-zinc-200/80 bg-white/90">
                <CardHeader className="space-y-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-zinc-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
