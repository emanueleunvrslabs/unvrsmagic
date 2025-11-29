import { DashboardLayout } from "@/components/dashboard-layout";

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
          {/* Add your experimental components here */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold mb-4">Component Testing Area</h2>
            <p className="text-muted-foreground">
              This is your experimental space. Add components, test designs, and prototype new features here.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
