import { PageIntro } from "@/components/layout/page-intro";
import { PlaceholderGrid } from "@/components/layout/placeholder-grid";

export default function UserProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <PageIntro
        eyebrow="Profile"
        title="User profile placeholder"
        description="This is the protected route reserved for editable member profile information once profile forms are implemented."
      />

      <PlaceholderGrid
        items={[
          {
            title: "Personal information",
            description: "Name, mobile, and profile image editing can map to the `/users/me` backend route.",
          },
          {
            title: "Role visibility",
            description: "The auth provider already exposes the resolved backend role for conditional profile actions.",
          },
        ]}
      />
    </main>
  );
}
