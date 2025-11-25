import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploadSection } from "@/components/dispacciamento/FileUploadSection";
import { JobsMonitor } from "@/components/dispacciamento/JobsMonitor";
import { ResultsDashboard } from "@/components/dispacciamento/ResultsDashboard";

export default function DispacciamentoPage() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dispacciamento Energia</h1>
          <p className="text-muted-foreground mt-2">
            Sistema di dispacciamento energia elettrica con calcolo profili giornalieri a 96 quarti d'ora
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Carica File</TabsTrigger>
            <TabsTrigger value="jobs">Lavori in Corso</TabsTrigger>
            <TabsTrigger value="results">Risultati</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 mt-6">
            <FileUploadSection />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6 mt-6">
            <JobsMonitor />
          </TabsContent>

          <TabsContent value="results" className="space-y-6 mt-6">
            <ResultsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
