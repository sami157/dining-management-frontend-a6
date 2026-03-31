import { PageIntro } from "@/components/layout/page-intro";
import { PlaceholderGrid } from "@/components/layout/placeholder-grid";

export default function UserDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <PageIntro
        eyebrow="Member Area"
        title="User dashboard scaffold"
        description="This route is now protected for authenticated users and ready for meal registration, monthly summary, and deposit overview work."
      />

      <PlaceholderGrid
        items={[
          {
            title: "Meal registrations",
            description: "Daily and monthly registration controls can live here behind the authenticated user shell.",
          },
          {
            title: "My financial summary",
            description: "Deposit totals, running balances, and finalized month summaries can be attached to the member view.",
          },
          {
            title: "Upcoming meals",
            description: "Use the shared axios client and role-aware context when you wire backend schedule queries.",
          },
        ]}
      />
    </main>
  );
}
