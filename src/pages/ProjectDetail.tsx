import { ProjectDashboard } from "@/components/project-dashboard";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useParams } from "react-router-dom";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <DashboardLayout>
      <ProjectDashboard projectId={projectId || ""} />
    </DashboardLayout>
  );
}
