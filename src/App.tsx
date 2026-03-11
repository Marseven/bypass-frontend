import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/useAuthStore";
import { lazy, Suspense, useCallback } from "react";
import { toast } from "sonner";
import api from "./axios";
import { useInactivityLogout } from "./hooks/useInactivityLogout";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Requests = lazy(() => import("./pages/Requests"));
const Validation = lazy(() => import("./pages/Validation"));
const History = lazy(() => import("./pages/History"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Zones = lazy(() => import("./pages/Zones"));
const Equipment = lazy(() => import("./pages/Equipment"));
const Users = lazy(() => import("./pages/Users"));
const Sensors = lazy(() => import("./pages/Sensors"));
const EditSensor = lazy(() => import("./pages/EditSensor"));
const SensorDetail = lazy(() => import("./pages/SensorDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const RolesPermissions = lazy(() => import("./pages/RolesPermissions"));
const Terms = lazy(() => import("./pages/Terms"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const Verify2FA = lazy(() => import("./pages/Verify2FA"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Forbidden = lazy(() => import("./pages/Forbidden"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();

  const handleAutoLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Auto logout error:', error);
    } finally {
      logout();
      toast.info('Session expirée', {
        description: 'Vous avez été déconnecté après une période d\'inactivité.',
      });
      navigate('/login');
    }
  }, [logout, navigate, toast]);

  useInactivityLogout({
    onTimeout: handleAutoLogout,
    enabled: Boolean(user && token),
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNavbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="bypass-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/login/verify-2fa" element={<Verify2FA />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director', 'operateur', 'technicien', 'instrumentiste', 'user']}>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/requests" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director', 'technicien', 'instrumentiste', 'operateur', 'user']}>
                  <Layout><Requests /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/requests/new" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director', 'technicien', 'instrumentiste', 'operateur', 'user']}>
                  <Layout><Requests /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/requests/mine" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director', 'technicien', 'instrumentiste', 'operateur', 'user']}>
                  <Layout><Requests /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/requests/pending" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director']}>
                  <Layout><Requests /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/validation" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director']}>
                  <Layout><Validation /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator']}>
                  <Layout><History /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/zones" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'resp_exploitation', 'directeur', 'director']}>
                  <Layout><Zones /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/equipment" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'responsable_hse', 'resp_exploitation', 'directeur', 'supervisor', 'director']}>
                  <Layout><Equipment /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator']}>
                  <Layout><Users /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/sensors" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'resp_exploitation', 'directeur', 'director']}>
                  <Layout><Sensors /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/sensors/:id" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'resp_exploitation', 'directeur', 'director']}>
                  <Layout><SensorDetail /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/sensors/:id/edit" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'resp_exploitation', 'directeur', 'director']}>
                  <Layout><EditSensor /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator']}>
                  <Layout><Settings /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/notification-preferences" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director', 'technicien', 'instrumentiste', 'operateur', 'user']}>
                  <Layout><NotificationPreferences /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director', 'technicien', 'instrumentiste', 'operateur', 'user']}>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/roles-permissions" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator']}>
                  <Layout><RolesPermissions /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/terms" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director', 'technicien', 'instrumentiste', 'operateur', 'user']}>
                  <Layout><Terms /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director', 'technicien', 'instrumentiste', 'operateur', 'user']}>
                  <Layout><Notifications /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/forbidden" element={<Forbidden />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
