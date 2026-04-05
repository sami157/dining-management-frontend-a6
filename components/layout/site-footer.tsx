import { CalendarDays, ShieldCheck, UtensilsCrossed, Wallet } from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/60">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 text-sm text-muted-foreground md:grid-cols-[1.2fr_0.8fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-base font-semibold text-foreground">Dining Management</p>
          <p className="max-w-md leading-6">
            A shared operations platform for meal scheduling, member registrations, contributions,
            expenses, and monthly accountability.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            What It Covers
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <UtensilsCrossed className="mt-0.5 size-4 text-primary" />
              <p>Meal schedules, registrations, and per-day operations.</p>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 size-4 text-primary" />
              <p>Deposits, expenses, and live balance-aware finance tracking.</p>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 text-primary" />
              <p>Monthly finalization history, rollback visibility, and public stats.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Platform Notes
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 text-primary" />
              <p>Role-aware access for members, managers, and admins.</p>
            </div>
            <p className="leading-6">
              Built for transparent dining operations with cleaner month-level reporting and
              day-level meal analytics.
            </p>
            <p className="text-xs text-muted-foreground/90">
              © {currentYear} Dining Management Web Application
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
