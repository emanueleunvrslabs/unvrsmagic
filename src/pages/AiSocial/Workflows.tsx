import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Workflows() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automated Workflows</h1>
            <p className="text-muted-foreground mt-2">
              Create automated content generation and publishing flows
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Workflows</CardTitle>
            <CardDescription>Manage automated content workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              No workflows configured yet. Create your first automated workflow!
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
