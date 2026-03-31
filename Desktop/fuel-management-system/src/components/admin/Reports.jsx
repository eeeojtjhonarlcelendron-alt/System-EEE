import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { Calendar, Fuel, TrendingUp, DollarSign } from 'lucide-react'

function Reports() {
  const [dateRange, setDateRange] = useState('7') // days
  const [fuelData, setFuelData] = useState([])
  const [vehicleData, setVehicleData] = useState([])
  const [dailyTransactions, setDailyTransactions] = useState([])
  const [summary, setSummary] = useState({
    totalLiters: 0,
    totalTransactions: 0,
    avgLitersPerDay: 0,
    mostUsedFuel: '-'
  })

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      const days = parseInt(dateRange)
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')
      
      // Fetch transactions
      const { data: transactions } = await supabase
        .from('fuel_transactions')
        .select(`
          *,
          fuel_requests (
            fuel_type,
            liters,
            vehicles (plate_number)
          )
        `)
        .gte('transaction_date', startDate)
        .order('transaction_date', { ascending: true })

      // Calculate fuel type distribution
      const fuelTypes = {}
      const vehicleUsage = {}
      const dailyData = {}
      let totalLiters = 0

      transactions?.forEach(t => {
        const fuelType = t.fuel_requests?.fuel_type
        const liters = t.fuel_given
        const vehicle = t.fuel_requests?.vehicles?.plate_number
        const date = format(new Date(t.transaction_date), 'MMM dd')

        // Fuel types
        if (fuelType) {
          fuelTypes[fuelType] = (fuelTypes[fuelType] || 0) + liters
        }

        // Vehicle usage
        if (vehicle) {
          vehicleUsage[vehicle] = (vehicleUsage[vehicle] || 0) + liters
        }

        // Daily data
        dailyData[date] = (dailyData[date] || 0) + liters
        totalLiters += liters
      })

      // Transform data for charts
      const fuelChartData = Object.entries(fuelTypes).map(([name, value]) => ({
        name,
        liters: value
      }))

      const vehicleChartData = Object.entries(vehicleUsage)
        .map(([name, value]) => ({ name, liters: value }))
        .sort((a, b) => b.liters - a.liters)
        .slice(0, 10) // Top 10

      // Fill in missing days
      const dateRange2 = eachDayOfInterval({
        start: subDays(new Date(), days),
        end: new Date()
      })
      
      const dailyChartData = dateRange2.map(date => {
        const dateStr = format(date, 'MMM dd')
        return {
          date: dateStr,
          liters: dailyData[dateStr] || 0
        }
      })

      // Find most used fuel
      const mostUsedFuel = Object.entries(fuelTypes)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

      setFuelData(fuelChartData)
      setVehicleData(vehicleChartData)
      setDailyTransactions(dailyChartData)
      setSummary({
        totalLiters,
        totalTransactions: transactions?.length || 0,
        avgLitersPerDay: totalLiters / days,
        mostUsedFuel
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
    }
  }

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899']

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fuel Reports & Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 3 Months</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          icon={<Fuel className="w-8 h-8 text-blue-600" />}
          title="Total Fuel Dispensed"
          value={`${summary.totalLiters.toFixed(2)} L`}
          color="blue"
        />
        <SummaryCard
          icon={<TrendingUp className="w-8 h-8 text-green-600" />}
          title="Total Transactions"
          value={summary.totalTransactions}
          color="green"
        />
        <SummaryCard
          icon={<Calendar className="w-8 h-8 text-purple-600" />}
          title="Avg per Day"
          value={`${summary.avgLitersPerDay.toFixed(2)} L`}
          color="purple"
        />
        <SummaryCard
          icon={<DollarSign className="w-8 h-8 text-yellow-600" />}
          title="Most Used Fuel"
          value={summary.mostUsedFuel}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Fuel Consumption</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTransactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="liters" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="#3b82f6"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fuel Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fuelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="liters"
              >
                {fuelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Vehicles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Vehicles by Fuel Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="liters" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon, title, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200'
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

export default Reports
