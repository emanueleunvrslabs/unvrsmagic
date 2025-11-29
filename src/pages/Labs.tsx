import { DashboardLayout } from "@/components/dashboard-layout";
import { SocialMediaCard } from "@/components/labs/SocialMediaCard";

export default function LabsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Labs</h1>
          <p className="text-muted-foreground mt-2">
            Experimental space for testing UI components, graphics, buttons and design elements
          </p>
        </div>

        <div className="grid gap-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold mb-4">Social Media Card</h2>
            <p className="text-muted-foreground mb-6">
              Interactive card with animated astronaut and social media links. Hover and drag the astronaut!
            </p>
            <div className="flex justify-center">
              <SocialMediaCard />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
