import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import TeamLeaderDashboard from './pages/TeamLeaderDashboard'
import GasStaffDashboard from './pages/GasStaffDashboard'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

function AppRoutes() {
  const { user, loading, isAdmin, isTeamLeader, isGasStaff } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RoleBasedRedirect />} />
        
        {/* Admin routes - only for admin */}
        <Route 
          path="/admin/*" 
          element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} 
        />
        
        {/* Team Leader routes - only for team_leader */}
        <Route 
          path="/team-leader/*" 
          element={isTeamLeader ? <TeamLeaderDashboard /> : <Navigate to="/" replace />} 
        />
        
        {/* Gas Staff routes - only for gas_staff */}
        <Route 
          path="/gas-staff/*" 
          element={isGasStaff ? <GasStaffDashboard /> : <Navigate to="/" replace />} 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function RoleBasedRedirect() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'team_leader':
      return <Navigate to="/team-leader" replace />
    case 'gas_staff':
      return <Navigate to="/gas-staff" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

export default App
