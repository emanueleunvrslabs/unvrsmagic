import { DashboardLayout } from "@/components/dashboard-layout";
import { FlaskConical } from "lucide-react";

export default function LabsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <FlaskConical className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Labs</h1>
        <p className="text-muted-foreground max-w-md">
          Experimental features and prototypes will appear here.
        </p>
      </div>
    </DashboardLayout>
  );
}
