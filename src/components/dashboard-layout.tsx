import React from "react";
import DashboardSidebarTopbar from "./dashboard-sidebar-topbar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return <DashboardSidebarTopbar>{children}</DashboardSidebarTopbar>;
};

export default DashboardLayout;
