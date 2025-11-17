import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./components/theme-provider";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
          <Route path="/trading" element={<ProtectedRoute><Trading /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/active" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/archived" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/wallets" element={<ProtectedRoute><Wallets /></ProtectedRoute>} />
          <Route path="/my-assets" element={<ProtectedRoute><MyAssets /></ProtectedRoute>} />
          <Route path="/portfolio-tracker" element={<ProtectedRoute><PortfolioTracker /></ProtectedRoute>} />
          <Route path="/ai-bot" element={<ProtectedRoute><AiBot /></ProtectedRoute>} />
          <Route path="/arbitrage-bot" element={<ProtectedRoute><ArbitrageBot /></ProtectedRoute>} />
          <Route path="/dca-bot" element={<ProtectedRoute><DcaBot /></ProtectedRoute>} />
          <Route path="/strategies-marketplace" element={<ProtectedRoute><StrategiesMarketplace /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/bot-settings" element={<ProtectedRoute><BotSettings /></ProtectedRoute>} />
          <Route path="/defi-protocols" element={<ProtectedRoute><DeFiProtocols /></ProtectedRoute>} />
          <Route path="/execution-logs" element={<ProtectedRoute><ExecutionLogs /></ProtectedRoute>} />
          {/* Control Panel prefixed routes */}
          <Route path="/control-panel/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
          <Route path="/control-panel/bot-settings" element={<ProtectedRoute><BotSettings /></ProtectedRoute>} />
          <Route path="/control-panel/execution-logs" element={<ProtectedRoute><ExecutionLogs /></ProtectedRoute>} />
          {/* Legacy/extra links redirects */}
          <Route path="/my-analytics" element={<Navigate to="/portfolio-tracker" replace />} />
          <Route path="/signal-bot" element={<Navigate to="/ai-bot" replace />} />
          <Route path="/pump-screener" element={<Navigate to="/trading" replace />} />
          <Route path="/defi-center/yield-farming" element={<Navigate to="/defi-protocols" replace />} />
          <Route path="/defi-center/staking-pools" element={<Navigate to="/defi-protocols" replace />} />
          <Route path="/defi-center/liquidity-tracker" element={<Navigate to="/defi-protocols" replace />} />
          <Route path="/bot-templates" element={<Navigate to="/strategies-marketplace" replace />} />
          <Route path="/invite-friends" element={<Navigate to="/settings" replace />} />
          <Route path="/help-center" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
