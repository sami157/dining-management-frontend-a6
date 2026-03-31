import { PageIntro } from "@/components/layout/page-intro";
import { PlaceholderGrid } from "@/components/layout/placeholder-grid";

export default function FundManagementPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Admin"
        title="Fund management"
        description="This route will hold deposits, expenses, month summaries, and finalization actions."
      />
      <PlaceholderGrid
        items={[
          {
            title: "Deposits",
            description: "Use `/deposits` and `/deposits/my-total` behind authenticated axios requests.",
          },
          {
            title: "Expenses",
            description: "Use the finance routes here for CRUD and category breakdown views.",
          },
          {
            title: "Finalization",
            description: "Month locking and summary views belong in this protected page.",
          },
        ]}
      />
    </div>
  );
}
