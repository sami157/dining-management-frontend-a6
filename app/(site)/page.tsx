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
    <main className="bg-shell flex-1">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Dining Management
              </p>
              <h1 className="title-font max-w-3xl text-5xl tracking-tight text-foreground">
                Shadcn now carries the same warm dining-system identity.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                The palette, rounded controls, expressive typography, and shared utilities from
                the separate daisyUI frontend are now mapped into shadcn tokens for this App
                Router codebase.
              </p>
              <p className="bangla-text max-w-2xl text-lg leading-8 text-foreground/78">
                একই ভিজ্যুয়াল মুড এখন shadcn কম্পোনেন্ট দিয়েই চালানো যাবে।
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

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Theme foundation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Shadcn tokens now mirror the separate daisyUI palette.</p>
              <p>Shared buttons, cards, inputs, and labels inherit the updated theme.</p>
              <p>Title and Bangla helper fonts are available across routes.</p>
              <p>Animated and background utilities moved into the global stylesheet.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title}>
                <CardHeader className="space-y-4">
                  <div className="flex size-12 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
