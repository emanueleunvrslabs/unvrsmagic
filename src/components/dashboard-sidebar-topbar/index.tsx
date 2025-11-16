"use client";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "./dashboardSidebar";
import { Topbar } from "./topbar";

const DashboardSidebarTopbar = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    setCollapsed(true);
  }, [pathname]);

  return (
    <div className=" h-screen w-full bg-background relative">
      <DashboardSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className={cn("duration-300", collapsed ? "sm:translate-x-[72px] sm:max-w-[calc(100%-72px)]" : "  md:translate-x-[72px] md:max-w-[calc(100%-72px)]")}>
        <Topbar />
        <main className="px-2 sm:px-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardSidebarTopbar;
