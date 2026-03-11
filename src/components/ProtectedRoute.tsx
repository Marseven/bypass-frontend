import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const location = useLocation();
  const { token, user } = useAuthStore();
  const toastShown = useRef(false);

  const isForbidden = token && user && !allowedRoles.includes(user.role);

  useEffect(() => {
    if (isForbidden && !toastShown.current) {
      toastShown.current = true;
      toast.error('Accès non autorisé', {
        description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
      });
    }
  }, [isForbidden]);

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isForbidden) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};
