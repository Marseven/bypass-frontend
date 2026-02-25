import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const location = useLocation();

  // Récupère le token et l'utilisateur depuis le store Redux
  const token = useSelector((state: RootState) => state.user.token);
  const user = useSelector((state: RootState) => state.user.user);

  // Vérifier d'abord si l'utilisateur est authentifié (token présent)
  if (!token || !user) {
    // Redirection vers la page login avec le return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ensuite vérifier si le rôle est autorisé
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/requests/new" replace />;
  }

  return <>{children}</>;
};
