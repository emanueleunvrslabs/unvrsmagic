import { DashboardLayout } from "@/components/dashboard-layout";
import { FileText } from "lucide-react";

export default function DelibereArera() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Delibere Arera</h1>
            <p className="text-muted-foreground mt-1">
              Gestione delibere ARERA
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-8 text-center">
          <p className="text-muted-foreground">
            Project ready. Tell me what features you need.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
