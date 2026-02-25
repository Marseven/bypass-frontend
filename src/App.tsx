import { Toaster } from "@/components/ui/toaster";
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
import { useToast } from "@/components/ui/use-toast";
import api from "./axios";
import { useInactivityLogout } from "./hooks/useInactivityLogout";
import { Loader2 } from "lucide-react";

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

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();

  const handleAutoLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Auto logout error:', error);
    } finally {
      logout();
      toast({
        title: 'Session expirée',
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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director']}>
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
                <ProtectedRoute allowedRoles={['administrateur', 'administrator', 'resp_exploitation', 'directeur', 'director']}>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
