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
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { logout } from "./store/users";
import type { AppDispatch, RootState } from "./store/store";
import { useToast } from "@/components/ui/use-toast";
import api from "./axios";
import { useInactivityLogout } from "./hooks/useInactivityLogout";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import Validation from "./pages/Validation";
import History from "./pages/History";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Zones from "./pages/Zones";
import Equipment from "./pages/Equipment";
import Users from "./pages/Users";
import Sensors from "./pages/Sensors";
import EditSensor from "./pages/EditSensor";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import RolesPermissions from "./pages/RolesPermissions";
import Terms from "./pages/Terms";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.user);

  const handleAutoLogout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Auto logout error:', error);
    } finally {
      dispatch(logout());
      toast({
        title: 'Session expirée',
        description: 'Vous avez été déconnecté après une période d’inactivité.',
      });
      navigate('/login');
    }
  }, [dispatch, navigate, toast]);

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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['administrator', 'supervisor']}>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute allowedRoles={['administrator', 'supervisor', 'user']}>
                <Layout><Requests /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/requests/new" element={
              <ProtectedRoute  allowedRoles={['administrator', 'supervisor', 'user']}>
                <Layout><Requests /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/requests/mine" element={
              <ProtectedRoute  allowedRoles={['administrator', 'supervisor', 'user']}>
                <Layout><Requests /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/requests/pending" element={
              <ProtectedRoute  allowedRoles={['administrator', 'supervisor']}>
                <Layout><Requests /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/validation" element={
              <ProtectedRoute  allowedRoles={['administrator', 'supervisor', 'user']}>
                <Layout><Validation /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute  allowedRoles={['administrator']}>
                <Layout><History /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/zones" element={
              <ProtectedRoute  allowedRoles={['administrator']}>
                <Layout><Zones /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/equipment" element={
              <ProtectedRoute  allowedRoles={['administrator']}>
                <Layout><Equipment /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute  allowedRoles={['administrator']}>
                <Layout><Users /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/sensors" element={
              <ProtectedRoute  allowedRoles={['administrator']}>
                <Layout><Sensors /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/sensors/:id/edit" element={
              <ProtectedRoute  allowedRoles={['administrator']}>
                <Layout><EditSensor /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute  allowedRoles={['administrator']}>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute  allowedRoles={['administrator', 'supervisor', 'user', 'director']}>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/roles-permissions" element={
              <ProtectedRoute  allowedRoles={['administrator']}>
                <Layout><RolesPermissions /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/terms" element={
              <ProtectedRoute  allowedRoles={['administrator', 'supervisor', 'user', 'director']}>
                <Layout><Terms /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute  allowedRoles={['administrator', 'supervisor', 'user', 'director']}>
                <Layout><Notifications /></Layout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
