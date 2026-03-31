import { PageIntro } from "@/components/layout/page-intro";
import { PlaceholderGrid } from "@/components/layout/placeholder-grid";

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Admin"
        title="Finalized history"
        description="This route is reserved for read-only finalized month history and breakdown views."
      />
      <PlaceholderGrid
        items={[
          {
            title: "Finalized month selector",
            description: "Use `/finalize` and `/finalize/:month` to populate this view.",
          },
          {
            title: "Read-only summaries",
            description: "This area can show expense totals, member balances, and closeout details without edit actions.",
          },
        ]}
      />
    </div>
  );
}
