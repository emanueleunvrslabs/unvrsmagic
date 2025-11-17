"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("Error fetching project:", error);
        navigate("/projects");
        return;
      }

      setProject(data);
      setLoading(false);
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === 'active' 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-gray-500/10 text-gray-500'
          }`}>
            {project.status === 'active' ? 'Active' : 'Archived'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Placeholder cards for overview */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                <p className="text-2xl font-bold mt-2">$0.00</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">P&L</h3>
                <p className="text-2xl font-bold mt-2 text-green-500">+$0.00</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Total Trades</h3>
                <p className="text-2xl font-bold mt-2">0</p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Win Rate</h3>
                <p className="text-2xl font-bold mt-2">0%</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Project Overview</h3>
              <p className="text-muted-foreground">
                This is the overview section for your project. Here you can see general statistics and information.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Portfolio</h3>
            <p className="text-muted-foreground">
              Manage your project portfolio and asset allocation here.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="mt-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Strategy</h3>
            <p className="text-muted-foreground">
              Configure your trading strategy and parameters here.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="trades" className="mt-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Trades History</h3>
            <p className="text-muted-foreground">
              View and analyze your trade history here.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Project Settings</h3>
            <p className="text-muted-foreground">
              Configure project settings, notifications, and preferences here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
