import { CalendarCheck, CircleDollarSign, UserRoundCheck } from "lucide-react";
import { PageIntro } from "@/components/layout/page-intro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const helpTopics = [
  {
    title: "Booking Meals",
    description:
      "Open My Dashboard, choose a date, and register breakfast, lunch, or dinner before the deadline.",
    icon: CalendarCheck,
  },
  {
    title: "Updating Your Profile",
    description:
      "Use the Profile page to keep your name, mobile number, and profile image accurate.",
    icon: UserRoundCheck,
  },
  {
    title: "Checking Finance Data",
    description:
      "Members can track their balance while managers review deposits, expenses, and finalization status.",
    icon: CircleDollarSign,
  },
];

export default function HelpPage() {
  return (
    <main className="bg-shell flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16">
        <PageIntro
          eyebrow="Help"
          title="Help for Daily Dining Workflows"
          description="Find quick guidance for the most common meal booking, profile, and finance tasks."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {helpTopics.map((topic) => {
            const Icon = topic.icon;

            return (
              <Card key={topic.title} className="h-full border-white/60 bg-muted">
                <CardHeader className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{topic.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-7 text-muted-foreground">{topic.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
