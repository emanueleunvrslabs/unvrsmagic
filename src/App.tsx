import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Overview from "./pages/Overview";
import Trading from "./pages/Trading";
import Wallets from "./pages/Wallets";
import MyAssets from "./pages/MyAssets";
import PortfolioTracker from "./pages/PortfolioTracker";
import AiBot from "./pages/AiBot";
import ArbitrageBot from "./pages/ArbitrageBot";
import DcaBot from "./pages/DcaBot";
import StrategiesMarketplace from "./pages/StrategiesMarketplace";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import BotSettings from "./pages/BotSettings";
import DeFiProtocols from "./pages/DeFiProtocols";
import ExecutionLogs from "./pages/ExecutionLogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/trading" element={<Trading />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/my-assets" element={<MyAssets />} />
          <Route path="/portfolio-tracker" element={<PortfolioTracker />} />
          <Route path="/ai-bot" element={<AiBot />} />
          <Route path="/arbitrage-bot" element={<ArbitrageBot />} />
          <Route path="/dca-bot" element={<DcaBot />} />
          <Route path="/strategies-marketplace" element={<StrategiesMarketplace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/bot-settings" element={<BotSettings />} />
          <Route path="/defi-protocols" element={<DeFiProtocols />} />
          <Route path="/execution-logs" element={<ExecutionLogs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
