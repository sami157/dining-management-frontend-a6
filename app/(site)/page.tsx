'use client'

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  ArrowRight,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  HandCoins,
  LockKeyhole,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trophy,
  UtensilsCrossed,
  UserRoundCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPublicStats } from "@/lib/api/stats";
import { getDashboardRoute } from "@/lib/auth/routes";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import "swiper/css";
import "swiper/css/pagination";

const features = [
  {
    title: "Meal Operations",
    description: "Manage schedules, deadlines, registrations, finances",
    icon: UtensilsCrossed,
  },
  {
    title: "Role-Based Access",
    description: "Seperate access for Members, Managers and Admins with clear permissions",
    icon: ShieldCheck,
  },
  {
    title: "Finance Tracking",
    description: "Follow contributions, expenses, and month closeout in one place.",
    icon: Wallet,
  },
];

const processSteps = [
  {
    title: "Register Meals",
    description: "Members choose breakfast, lunch, and dinner meals before the deadline.",
    icon: UtensilsCrossed,
  },
  {
    title: "Run Operations",
    description: "Managers oversee schedules, registrations, deposits, and monthly operations.",
    icon: Clock3,
  },
  {
    title: "Close The Month",
    description: "Finalization locks the month and computes the operational meal rate from weighted usage.",
    icon: CheckCircle2,
  },
];

const memberExperience = [
  "Browse meal schedules by date.",
  "Book breakfast, lunch, and dinner before deadlines.",
  "Update meal counts while registration is still open.",
];

const managerOperations = [
  "Generate daily or monthly schedules.",
  "Repair missing meal slots and update menus.",
  "Review member registrations from one place.",
];

const financeWorkflow = [
  "Track member deposits by month.",
  "Record bazar, gas, transport, and other expenses.",
  "Compare deposits, expenses, balances, and meal usage.",
];

const deadlineControls = [
  "Configure meal-specific registration deadlines.",
  "Use weekly templates to speed up schedule creation.",
  "Keep unavailable meals and closed deadlines clear in the UI.",
];

const accessControls = [
  "Members only manage their own dining activity.",
  "Managers control schedules, registrations, and finance.",
  "Admins can manage roles and protected rollback actions.",
];

const closeoutWorkflow = [
  "Finalize a completed month.",
  "Preserve month-level finance and meal history.",
  "Rollback finalized months when admin review requires it.",
];

const faqs = [
  {
    question: "Can Members Cancel Meals?",
    answer: "Yes. Members can cancel or update registrations while the configured deadline allows it.",
  },
  {
    question: "Can Managers Generate a Full Month?",
    answer: "Yes. Weekly templates can be used to generate a complete month of meal schedules.",
  },
  {
    question: "Does Finance Data Use Live Backend Records?",
    answer: "Yes. Deposits, expenses, stats, and finalization data are loaded through the backend API.",
  },
];

const heroSlides = [
  {
    title: "Never Miss a Meal Deadline",
    description:
      "See upcoming meals, book your count, and make changes before the cutoff without asking someone to check a spreadsheet.",
    benefit: "Book breakfast, lunch, and dinner with confidence.",
    icon: CalendarClock,
  },
  {
    title: "Know What Is Cooking Today",
    description:
      "Managers can publish menus, mark meals unavailable, and keep everyone aligned on the day’s dining plan.",
    benefit: "Reduce confusion around menus and availability.",
    icon: UtensilsCrossed,
  },
  {
    title: "Understand Every Month's Cost",
    description:
      "Track deposits, expenses, weighted meals, and finalization so the monthly meal rate is easier to explain.",
    benefit: "Make month-end accounting transparent.",
    icon: Wallet,
  },
];


const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

const amountFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 2,
});

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, 1);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return monthFormatter.format(parsed);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not finalized";
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00+06:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return shortDateFormatter.format(parsed);
};

const formatAmount = (value: number) => amountFormatter.format(value);

function PublicMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function HeroSlider() {
  return (
    <div className="min-w-0 w-full max-w-full overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3600, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="hero-swiper h-full w-full max-w-full"
      >
        {heroSlides.map((slide) => {
          const Icon = slide.icon;

          return (
            <SwiperSlide key={slide.title} className="max-w-full">
              <div className="h-full min-h-80 rounded-lg bg-muted p-6">
                <div className="flex h-full min-h-68 flex-col justify-between gap-8">
                  <div className="space-y-5">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Dining Made Clear
                      </p>
                      <h2 className="title-font text-3xl text-foreground">{slide.title}</h2>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {slide.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-lg bg-background px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Why It Matters
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-foreground">
                        {slide.benefit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="title-font text-3xl text-foreground">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function ChecklistSection({
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
}) {
  return (
    <section className="grid gap-5 rounded-xl border border-border bg-card p-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <div className="space-y-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, appUser } = useAuth();
  const publicStatsQuery = useQuery({
    queryKey: ["stats", "public"],
    queryFn: () => getPublicStats(),
  });

  const publicStats = publicStatsQuery.data;
  const publicStatsError =
    publicStatsQuery.error instanceof Error ? publicStatsQuery.error.message : null;

  return (
    <main className="bg-shell flex-1">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
          <div className="min-w-0 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Dining Management
              </p>
              <h1 className="title-font max-w-3xl text-5xl tracking-tight text-foreground">
                Web-Based Solution For Managing Community Dinings That Just...Works
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                Streamline your dining operations with a system designed for the full meal cycle,
                from scheduling and registrations to financial tracking and monthly closeout. Say
                goodbye to manual spreadsheets and hello to operational clarity for everyone.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button onClick={() => router.push(getDashboardRoute(appUser?.role))}>
                    Open Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <>
                  <Button onClick={() => router.push("/login")}>
                    Login
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/register")}>
                    Create Account
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <HeroSlider />
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="Stats"
            title="Live Monthly Snapshot"
            description="A public operational summary pulled from the current dining records."
          />
          {publicStats ? (
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <PublicMetric
                icon={Users}
                label="Active members"
                value={String(publicStats.community.activeMembers)}
                detail={`${publicStats.community.activeManagers} active managers`}
              />
              <PublicMetric
                icon={HandCoins}
                label="Monthly deposits"
                value={formatAmount(publicStats.finance.totalDeposits)}
                detail={`Tracked for ${formatMonthLabel(publicStats.month)}`}
              />
              <PublicMetric
                icon={Wallet}
                label="Monthly expenses"
                value={formatAmount(publicStats.finance.totalExpenses)}
                detail="Operational spending for the selected month"
              />
              <PublicMetric
                icon={UtensilsCrossed}
                label="Meals registered"
                value={String(publicStats.meals.totalMealsRegistered)}
                detail='Includes registrations across all registered accounts'
              />
              <PublicMetric
                icon={Wallet}
                label="Weighted meals"
                value={String(publicStats.meals.totalWeightedMeals)}
                detail={`${publicStats.meals.scheduleCount} scheduled day${publicStats.meals.scheduleCount === 1 ? "" : "s"}`}
              />
              <PublicMetric
                icon={Trophy}
                label="Top depositor"
                value={publicStats.highlights.topDepositor?.name ?? "No data"}
                detail={
                  publicStats.highlights.topDepositor
                    ? `${formatAmount(publicStats.highlights.topDepositor.totalAmount)} deposited`
                    : "No deposits recorded this month"
                }
              />
              <PublicMetric
                icon={CheckCircle2}
                label="Top consumer"
                value={publicStats.highlights.topConsumer?.name ?? "No data"}
                detail={
                  publicStats.highlights.topConsumer
                    ? `${publicStats.highlights.topConsumer.totalWeightedMeals} weighted meals`
                    : "No meal registrations recorded this month"
                }
              />
              <PublicMetric
                icon={CalendarClock}
                label="Month status"
                value={publicStats.finalization.isFinalized ? "Finalized" : "Open"}
                detail={
                  publicStats.finalization.rolledBackAt
                    ? `Rolled back on ${formatDate(publicStats.finalization.rolledBackAt)}`
                    : publicStats.finalization.isFinalized
                      ? `Finalized on ${formatDate(publicStats.finalization.finalizedAt)}`
                      : `Tracking ${formatMonthLabel(publicStats.month)}`
                }
              />
            </div>
          ) : publicStatsQuery.isPending ? (
            <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              Loading public stats...
            </div>
          ) : (
            <div className={cn("rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground")}>
              Public stats could not be loaded: {publicStatsError ?? "Request failed."}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="How It Works"
            title="3 Steps From Meal Plan to Closeout"
            description="The app follows the same operational rhythm as a real shared dining setup."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step) => {
              const Icon = step.icon;

              return (
                <Card key={step.title}>
                  <CardHeader className="space-y-4">
                    <div className="flex size-12 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="Core Capabilities"
            title="Built for Daily Operations and Monthly Accountability"
            description="The main workflows are grouped around meals, access, and finance."
          />
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

        <ChecklistSection
          eyebrow="Member Experience"
          title="A Clear Flow for Meal Booking"
          description="Members can see what is available and act before the deadline."
          icon={UserRoundCheck}
          items={memberExperience}
        />

        <ChecklistSection
          eyebrow="Manager Operations"
          title="Controls for Daily Dining Work"
          description="Managers get focused tools for schedules, meals, and registrations."
          icon={Settings2}
          items={managerOperations}
        />

        <ChecklistSection
          eyebrow="Finance Tracking"
          title="Deposits and Expenses Stay Connected"
          description="Finance records stay tied to month-level operations and member balances."
          icon={HandCoins}
          items={financeWorkflow}
        />

        <ChecklistSection
          eyebrow="Deadline Control"
          title="Rules That Match Meal Timing"
          description="Deadline and template controls keep registration behavior predictable."
          icon={CalendarDays}
          items={deadlineControls}
        />

        <ChecklistSection
          eyebrow="Access Control"
          title="Separate Permissions by Role"
          description="The interface changes based on whether the user is a member, manager, or admin."
          icon={LockKeyhole}
          items={accessControls}
        />

        <ChecklistSection
          eyebrow="Month-End Workflow"
          title="Close, Review, and Roll Back"
          description="Month-end actions are built around traceable finance and meal summaries."
          icon={RefreshCw}
          items={closeoutWorkflow}
        />

        <section className="space-y-5">
          <SectionHeading
            eyebrow="FAQ"
            title="Common Questions"
            description="Short answers for the workflows users usually ask about first."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <Card key={faq.question} className="h-full">
                <CardHeader className="space-y-4">
                  <div className="flex size-12 items-center justify-center rounded-[calc(var(--radius)+0.5rem)] bg-accent text-accent-foreground">
                    <FileText className="size-5" />
                  </div>
                  <CardTitle className="text-xl">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card px-6 py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <SectionHeading
              eyebrow="Get Started"
              title="Use the Dashboard Built for Your Role"
              description="Sign in to manage meals as a member or operate the dining workflow as a manager."
            />
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Button onClick={() => router.push(getDashboardRoute(appUser?.role))}>
                  Open Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <>
                  <Button onClick={() => router.push("/login")}>
                    Login
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/register")}>
                    Create Account
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
