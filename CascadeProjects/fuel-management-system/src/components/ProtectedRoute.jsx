import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, hasRole, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'team_leader') return <Navigate to="/leader" replace />;
    if (user?.role === 'rider') return <Navigate to="/rider" replace />;
    if (user?.role === 'gasoline_staff') return <Navigate to="/staff" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
