import { Mail, MapPin, Phone } from "lucide-react";
import { PageIntro } from "@/components/layout/page-intro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const contactItems = [
  {
    title: "Email Support",
    value: "support@dining-management.local",
    description: "Use email for account, access, and month-end reporting questions.",
    icon: Mail,
  },
  {
    title: "Phone Desk",
    value: "+880 1700-000000",
    description: "Reach the operations desk for urgent meal schedule corrections.",
    icon: Phone,
  },
  {
    title: "Service Area",
    value: "Dhaka, Bangladesh",
    description: "Designed around shared dining operations and Dhaka-time deadlines.",
    icon: MapPin,
  },
];

export default function ContactPage() {
  return (
    <main className="bg-shell flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-16">
        <PageIntro
          eyebrow="Contact"
          title="Contact the Dining Operations Team"
          description="Use these channels for access issues, registration questions, schedule corrections, and finance follow-up."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {contactItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="h-full border-white/60 bg-muted">
                <CardHeader className="space-y-3">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-foreground">{item.value}</p>
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
