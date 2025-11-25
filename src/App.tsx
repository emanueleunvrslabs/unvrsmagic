import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./components/theme-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomeRedirect } from "./components/HomeRedirect";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AiBot from "./pages/AiBot";
import StrategiesMarketplace from "./pages/StrategiesMarketplace";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Auth from "./pages/Auth";
import ProjectDetail from "./pages/ProjectDetail";
import MktData from "./pages/MktData";
import NKMTDashboard from "./pages/NKMTDashboard";
import NotificationCenter from "./pages/NotificationCenter";
import Marketplace from "./pages/Marketplace";
import AdminProjects from "./pages/AdminProjects";
import AdminDashboard from "./pages/AdminDashboard";
import AiSocialDashboard from "./pages/AiSocial/AiSocialDashboard";
import GenerateImage from "./pages/AiSocial/GenerateImage";
import GenerateVideo from "./pages/AiSocial/GenerateVideo";
import SchedulePost from "./pages/AiSocial/SchedulePost";
import Workflows from "./pages/AiSocial/Workflows";
import Connection from "./pages/AiSocial/Connection";
import Wallet from "./pages/Wallet";

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
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/nkmt/:exchange" element={<ProtectedRoute><AiBot /></ProtectedRoute>} />
          <Route path="/nkmt/mkt-data" element={<ProtectedRoute><MktData /></ProtectedRoute>} />
          <Route path="/nkmt/dashboard" element={<ProtectedRoute><NKMTDashboard /></ProtectedRoute>} />
          <Route path="/nkmt" element={<Navigate to="/nkmt/dashboard" replace />} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute><AdminProjects /></ProtectedRoute>} />
          <Route path="/ai-social" element={<ProtectedRoute><AiSocialDashboard /></ProtectedRoute>} />
          <Route path="/ai-social/generate-image" element={<ProtectedRoute><GenerateImage /></ProtectedRoute>} />
          <Route path="/ai-social/generate-video" element={<ProtectedRoute><GenerateVideo /></ProtectedRoute>} />
          <Route path="/ai-social/schedule" element={<ProtectedRoute><SchedulePost /></ProtectedRoute>} />
          <Route path="/ai-social/workflows" element={<ProtectedRoute><Workflows /></ProtectedRoute>} />
          <Route path="/ai-social/connection" element={<ProtectedRoute><Connection /></ProtectedRoute>} />
          <Route path="/strategies-marketplace" element={<ProtectedRoute><StrategiesMarketplace /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          {/* Redirects for removed pages */}
          <Route path="/bot-templates" element={<HomeRedirect />} />
          <Route path="/overview" element={<HomeRedirect />} />
          <Route path="/my-assets" element={<HomeRedirect />} />
          <Route path="/my-analytics" element={<HomeRedirect />} />
          <Route path="/trading" element={<HomeRedirect />} />
          <Route path="/wallets" element={<HomeRedirect />} />
          <Route path="/portfolio-tracker" element={<HomeRedirect />} />
          <Route path="/signal-bot" element={<HomeRedirect />} />
          <Route path="/dca-bot" element={<HomeRedirect />} />
          <Route path="/arbitrage-bot" element={<HomeRedirect />} />
          <Route path="/pump-screener" element={<HomeRedirect />} />
          <Route path="/defi-protocols" element={<HomeRedirect />} />
          <Route path="/defi-center/*" element={<HomeRedirect />} />
          <Route path="/control-panel/*" element={<HomeRedirect />} />
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
