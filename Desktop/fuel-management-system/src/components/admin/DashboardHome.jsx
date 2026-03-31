import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Users, 
  Car, 
  Fuel, 
  QrCode, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { format, subDays } from 'date-fns'

function DashboardHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    totalRequests: 0,
    usedQR: 0,
    unusedQR: 0,
    todayTransactions: 0
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch counts
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: vehiclesCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })

      const { count: requestsCount } = await supabase
        .from('fuel_requests')
        .select('*', { count: 'exact', head: true })

      const { count: usedCount } = await supabase
        .from('fuel_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'used')

      const { count: unusedCount } = await supabase
        .from('fuel_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unused')

      // Fetch today's transactions
      const today = format(new Date(), 'yyyy-MM-dd')
      const { count: todayCount } = await supabase
        .from('fuel_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('transaction_date', today)

      // Fetch recent requests
      const { data: recentData } = await supabase
        .from('fuel_requests')
        .select(`
          *,
          vehicles (plate_number),
          users (name)
        `)
        .order('date_created', { ascending: false })
        .limit(5)

      setStats({
        totalUsers: usersCount || 0,
        totalVehicles: vehiclesCount || 0,
        totalRequests: requestsCount || 0,
        usedQR: usedCount || 0,
        unusedQR: unusedCount || 0,
        todayTransactions: todayCount || 0
      })

      setRecentRequests(recentData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-8 h-8 text-blue-600" />}
          title="Total Users"
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          icon={<Car className="w-8 h-8 text-green-600" />}
          title="Total Vehicles"
          value={stats.totalVehicles}
          color="green"
        />
        <StatCard
          icon={<Fuel className="w-8 h-8 text-yellow-600" />}
          title="Total Requests"
          value={stats.totalRequests}
          color="yellow"
        />
        <StatCard
          icon={<QrCode className="w-8 h-8 text-purple-600" />}
          title="Used QR Codes"
          value={stats.usedQR}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="w-8 h-8 text-indigo-600" />}
          title="Unused QR Codes"
          value={stats.unusedQR}
          color="indigo"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8 text-red-600" />}
          title="Today's Transactions"
          value={stats.todayTransactions}
          color="red"
        />
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Fuel Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liters</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.vehicles?.plate_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.fuel_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.liters} L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.users?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'used'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'unused'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(request.date_created), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    red: 'bg-red-50 border-red-200'
  }

  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome
