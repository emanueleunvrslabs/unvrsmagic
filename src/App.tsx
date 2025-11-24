import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./components/theme-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AiBot from "./pages/AiBot";
import StrategiesMarketplace from "./pages/StrategiesMarketplace";
import BotTemplates from "./pages/BotTemplates";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Auth from "./pages/Auth";
import ProjectDetail from "./pages/ProjectDetail";
import MktData from "./pages/MktData";
import NKMTDashboard from "./pages/NKMTDashboard";
import NotificationCenter from "./pages/NotificationCenter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<ProtectedRoute><NKMTDashboard /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/nkmt/:exchange" element={<ProtectedRoute><AiBot /></ProtectedRoute>} />
          <Route path="/nkmt/mkt-data" element={<ProtectedRoute><MktData /></ProtectedRoute>} />
          <Route path="/nkmt/dashboard" element={<ProtectedRoute><NKMTDashboard /></ProtectedRoute>} />
          <Route path="/nkmt" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
          <Route path="/strategies-marketplace" element={<ProtectedRoute><StrategiesMarketplace /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/bot-templates" element={<ProtectedRoute><BotTemplates /></ProtectedRoute>} />
          {/* Redirects for removed pages */}
          <Route path="/overview" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/my-assets" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/my-analytics" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/trading" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/wallets" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/portfolio-tracker" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/signal-bot" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/dca-bot" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/arbitrage-bot" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/pump-screener" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/defi-protocols" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/defi-center/*" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/control-panel/*" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/invite-friends" element={<Navigate to="/settings" replace />} />
          <Route path="/help-center" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
        </NotificationProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
