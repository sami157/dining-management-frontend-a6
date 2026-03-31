import { PageIntro } from "@/components/layout/page-intro";
import { PlaceholderGrid } from "@/components/layout/placeholder-grid";

export default function MemberManagementPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Admin"
        title="Member management"
        description="This protected page is the place for user lists, role changes, and member-level operational controls."
      />
      <PlaceholderGrid
        items={[
          {
            title: "User list",
            description: "Connect `/users` and `/users/:id` queries here for admin and manager workflows.",
          },
          {
            title: "Role controls",
            description: "ADMIN-only role edits can branch from the resolved backend role in context.",
          },
          {
            title: "Operational overrides",
            description: "Member registration and status adjustments can live here without exposing them to members.",
          },
        ]}
      />
    </div>
  );
}
