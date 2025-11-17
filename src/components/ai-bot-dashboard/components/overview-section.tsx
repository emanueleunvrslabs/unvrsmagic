"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BotData } from "../types";
import { AiInsights } from "./ai-insights";
import { PerformanceChart } from "./performance-chart";

interface OverviewSectionProps {
  botData: BotData;
  onViewAllTrades: () => void;
  onViewAllInsights: () => void;
}

export function OverviewSection({ botData, onViewAllTrades, onViewAllInsights }: OverviewSectionProps) {
  return (
    <>
      <PerformanceChart />

      <AiInsights insights={botData.aiInsights} onViewAll={onViewAllInsights} />
    </>
  );
}
