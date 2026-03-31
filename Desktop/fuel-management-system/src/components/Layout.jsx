import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  UsersRound,
  Truck,
  Car,
  Fuel, 
  QrCode, 
  LogOut,
  BarChart3,
  ScanLine,
  Store,
  FileSpreadsheet
} from 'lucide-react'

function Layout({ children }) {
  const { user, signOut, isAdmin, isTeamLeader, isGasStaff } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
            <Fuel className="w-6 h-6" />
            Fuel Manager
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {isAdmin && (
            <>
              <NavLink to="/admin" icon={<LayoutDashboard />}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/users" icon={<Users />}>
                Users
              </NavLink>
              <NavLink to="/admin/riders" icon={<Truck />}>
                Riders
              </NavLink>
              <NavLink to="/admin/team-leaders" icon={<UsersRound />}>
                Team Leaders
              </NavLink>
              <NavLink to="/admin/gas-station" icon={<Store />}>
                Gas Station
              </NavLink>
            </>
          )}

          {isTeamLeader && (
            <>
              <NavLink to="/team-leader" icon={<LayoutDashboard />}>
                Dashboard
              </NavLink>
              <NavLink to="/team-leader/create-po" icon={<QrCode />}>
                Create Fuel PO
              </NavLink>
              <NavLink to="/team-leader/history" icon={<Fuel />}>
                Request History
              </NavLink>
              <NavLink to="/team-leader/riders" icon={<Car />}>
                Riders
              </NavLink>
            </>
          )}

          {isGasStaff && (
            <>
              <NavLink to="/gas-staff" icon={<LayoutDashboard />}>
                Dashboard
              </NavLink>
              <NavLink to="/gas-staff/scan" icon={<ScanLine />}>
                Scan QR Code
              </NavLink>
              <NavLink to="/gas-staff/transactions" icon={<Fuel />}>
                Today's Transactions
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4 px-4 py-2 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function NavLink({ to, icon, children }) {
  const location = useLocation()
  const isActive = location.pathname === to
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-50 text-primary-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}

export default Layout
