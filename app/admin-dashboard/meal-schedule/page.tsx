import { PageIntro } from "@/components/layout/page-intro";
import { PlaceholderGrid } from "@/components/layout/placeholder-grid";

export default function MealSchedulePage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Admin"
        title="Meal schedule"
        description="Reserved for weekly schedule CRUD, generation, and per-meal availability updates."
      />
      <PlaceholderGrid
        items={[
          {
            title: "Weekly schedule CRUD",
            description: "Connect `/schedules`, `/schedules/generate`, and related mutation routes here.",
          },
          {
            title: "Deadline-aware UX",
            description: "Keep all date semantics aligned with Dhaka business dates from the integration guide.",
          },
        ]}
      />
    </div>
  );
}
