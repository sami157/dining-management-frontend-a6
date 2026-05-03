import { CalendarDays, HandCoins, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { PageIntro } from "@/components/layout/page-intro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Meal Planning",
    description:
      "Members can book meals while managers keep daily breakfast, lunch, and dinner schedules accurate.",
    icon: UtensilsCrossed,
  },
  {
    title: "Monthly Accounting",
    description:
      "Deposits, expenses, meal counts, and finalization data stay connected in one operational view.",
    icon: HandCoins,
  },
  {
    title: "Role Control",
    description:
      "Members, managers, and admins each get access to the workflows they need without exposing extra controls.",
    icon: ShieldCheck,
  },
  {
    title: "Deadline Awareness",
    description:
      "Meal registration deadlines and schedule availability help teams avoid last-minute confusion.",
    icon: CalendarDays,
  },
];

export default function AboutPage() {
  return (
    <main className="bg-shell flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16">
        <PageIntro
          eyebrow="About"
          title="A Practical Dining Operations Dashboard"
          description="Dining Management is built for shared communities that need clearer meal planning, member registration, fund tracking, and month-end accountability."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="h-full border-white/60 bg-muted">
                <CardHeader className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-7 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
