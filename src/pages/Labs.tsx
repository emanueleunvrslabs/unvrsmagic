import { DashboardLayout } from "@/components/dashboard-layout";

export default function LabsPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="p-8 rounded-lg border border-border bg-card/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">Labs</h2>
          <p className="text-muted-foreground">
            Clean experimental space for building new components
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
