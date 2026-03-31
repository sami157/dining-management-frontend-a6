import { PageIntro } from "@/components/layout/page-intro";
import { PlaceholderGrid } from "@/components/layout/placeholder-grid";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Admin"
        title="Dashboard overview scaffold"
        description="Manager and admin users land here first. This shell persists the sidebar across all child routes."
      />
      <PlaceholderGrid
        items={[
          {
            title: "Operations summary",
            description: "Use this page for counts, upcoming deadlines, and quick navigation into schedule and finance flows.",
          },
          {
            title: "Role-aware actions",
            description: "Manager-only and admin-only actions can now branch off the resolved app user role in context.",
          },
          {
            title: "Protected shell",
            description: "This entire subtree is already restricted to ADMIN and MANAGER roles.",
          },
        ]}
      />
    </div>
  );
}
