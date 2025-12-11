"use client";
import React, { useState } from "react";
import { DashboardSidebar } from "./dashboardSidebar";
import { Topbar } from "./topbar";

const DashboardSidebarTopbar = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen w-full">
      <DashboardSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="pl-[290px] pt-4 pr-4 pb-4">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardSidebarTopbar;
