import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeamLeaderDashboard from './pages/TeamLeaderDashboard';
import GasStationStaff from './pages/GasStationStaff';

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    switch (user?.role) {
      case 'admin': return '/admin';
      case 'team_leader': return '/leader';
      case 'gasoline_staff': return '/staff';
      default: return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/leader" element={
        <ProtectedRoute allowedRoles="team_leader">
          <TeamLeaderDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles="gasoline_staff">
          <GasStationStaff />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App
