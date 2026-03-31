import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { CheckCircle, AlertCircle, Fuel, Calendar, User, Car, Droplets, ArrowLeft, History } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function GasStaffDashboard() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/scan" element={<ScanQR />} />
      <Route path="/transactions" element={<Transactions />} />
    </Routes>
  )
}

// Dashboard Home
function DashboardHome() {
  const [stats, setStats] = useState({
    todayTransactions: 0,
    totalLitersToday: 0,
    pendingQR: 0,
    totalScanned: 0
  })
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Today's transactions by this staff
      const { data: todayData } = await supabase
        .from('fuel_transactions')
        .select('fuel_given')
        .eq('gas_staff_id', user?.id)
        .gte('transaction_date', today)

      const totalLiters = todayData?.reduce((sum, t) => sum + (t.fuel_given || 0), 0) || 0

      // Pending unused QR codes
      const { count: pendingCount } = await supabase
        .from('fuel_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unused')
        .gte('expires_at', new Date().toISOString())

      // Total scanned by this staff
      const { count: totalCount } = await supabase
        .from('fuel_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('gas_staff_id', user?.id)

      setStats({
        todayTransactions: todayData?.length || 0,
        totalLitersToday: totalLiters,
        pendingQR: pendingCount || 0,
        totalScanned: totalCount || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gas Staff Dashboard</h2>

      {/* Quick Scan Action */}
      <a
        href="/gas-staff/scan"
        className="bg-green-600 text-white p-8 rounded-xl hover:bg-green-700 transition-colors flex flex-col items-center justify-center gap-4 mb-8"
      >
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold">Scan QR Code</h3>
          <p className="text-green-100 mt-2">Verify and process fuel requests</p>
        </div>
      </a>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Today's Transactions" value={stats.todayTransactions} color="green" />
        <StatCard title="Liters Today" value={`${stats.totalLitersToday.toFixed(1)}L`} color="blue" />
        <StatCard title="Active QR Codes" value={stats.pendingQR} color="yellow" />
        <StatCard title="Total Scanned" value={stats.totalScanned} color="purple" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/gas-staff/scan"
            className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Scan QR Code</p>
              <p className="text-sm text-gray-600">Verify fuel request</p>
            </div>
          </Link>
          <Link
            to="/gas-staff/transactions"
            className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Transactions</p>
              <p className="text-sm text-gray-600">See today's activity</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

// QR Scanner
function ScanQR() {
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [requestDetails, setRequestDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fuelGiven, setFuelGiven] = useState('')
  const { user } = useAuth()
  const scannerRef = useRef(null)

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      scannerRef.current.render(onScanSuccess, onScanError)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [scanning])

  const onScanSuccess = async (decodedText) => {
    try {
      const qrData = JSON.parse(decodedText)
      setScannedData(qrData)
      
      // Fetch full request details
      const { data, error } = await supabase
        .from('fuel_requests')
        .select(`
          *,
          vehicles (plate_number, driver_name, department)
        `)
        .eq('id', qrData.request_id)
        .single()

      if (error) throw error
      
      setRequestDetails(data)
      setFuelGiven(data.liters.toString())
      setScanning(false)

      // Stop scanner
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    } catch (error) {
      console.error('Error processing QR:', error)
      toast.error('Invalid QR Code')
    }
  }

  const onScanError = (error) => {
    // Ignore scan errors during scanning
  }

  const handleVerify = async () => {
    if (!requestDetails || !fuelGiven) return

    setLoading(true)
    try {
      // Check if already used
      if (requestDetails.status === 'used') {
        toast.error('This QR code has already been used!')
        setLoading(false)
        return
      }

      // Check if expired
      if (new Date(requestDetails.expires_at) < new Date()) {
        toast.error('This QR code has expired!')
        setLoading(false)
        return
      }

      // Update fuel request status
      const { error: updateError } = await supabase
        .from('fuel_requests')
        .update({
          status: 'used',
          date_used: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', requestDetails.id)

      if (updateError) throw updateError

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('fuel_transactions')
        .insert({
          request_id: requestDetails.id,
          fuel_given: parseFloat(fuelGiven),
          gas_staff_id: user?.id,
          transaction_date: new Date().toISOString()
        })

      if (transactionError) throw transactionError

      toast.success('Fuel dispensed successfully!')
      
      // Reset
      setScannedData(null)
      setRequestDetails(null)
      setFuelGiven('')
    } catch (error) {
      console.error('Error verifying fuel:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetScanner = () => {
    setScannedData(null)
    setRequestDetails(null)
    setFuelGiven('')
    setScanning(false)
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href="/gas-staff" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </a>
        <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
      </div>

      {!scanning && !requestDetails && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Scan</h3>
            <p className="text-gray-600 mb-6">Position the QR code in front of your camera to verify the fuel request.</p>
            <button
              onClick={() => setScanning(true)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
            >
              Start Scanning
            </button>
          </div>
        </div>
      )}

      {scanning && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div id="qr-reader" className="w-full"></div>
            <button
              onClick={() => {
                setScanning(false)
                if (scannerRef.current) {
                  scannerRef.current.clear()
                  scannerRef.current = null
                }
              }}
              className="w-full mt-4 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {requestDetails && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                requestDetails.status === 'unused' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {requestDetails.status === 'unused' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {requestDetails.status === 'unused' ? 'Valid QR Code' : 'QR Code Already Used'}
                </h3>
                <p className="text-sm text-gray-500">Status: {requestDetails.status}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Car className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900">{requestDetails.vehicles?.plate_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="font-medium text-gray-900">{requestDetails.vehicles?.driver_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Droplets className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Fuel Type</p>
                  <p className="font-medium text-gray-900">{requestDetails.fuel_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Fuel className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Requested Amount</p>
                  <p className="font-medium text-gray-900">{requestDetails.liters} Liters</p>
                </div>
              </div>
            </div>

            {requestDetails.status === 'unused' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Fuel Given (Liters)
                  </label>
                  <input
                    type="number"
                    value={fuelGiven}
                    onChange={(e) => setFuelGiven(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter liters dispensed"
                    min="0"
                    step="0.01"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={loading || !fuelGiven}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm & Dispense Fuel
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={resetScanner}
              className="w-full mt-4 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              Scan Another QR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Transactions History
function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalLiters: 0, count: 0 })

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('fuel_transactions')
        .select(`
          *,
          fuel_requests (
            fuel_type,
            liters,
            vehicles (plate_number, driver_name)
          )
        `)
        .eq('gas_staff_id', user?.id)
        .gte('transaction_date', today)
        .order('transaction_date', { ascending: false })

      if (error) throw error

      const totalLiters = data?.reduce((sum, t) => sum + (t.fuel_given || 0), 0) || 0

      setTransactions(data || [])
      setStats({
        totalLiters,
        count: data?.length || 0
      })
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href="/gas-staff" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </a>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Today's Transactions</h2>
          <p className="text-gray-500">{format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-600">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-900">{stats.count}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-medium text-green-600">Total Liters</p>
          <p className="text-2xl font-bold text-green-900">{stats.totalLiters.toFixed(1)}L</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions today
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.fuel_requests?.vehicles?.plate_number}</p>
                    <p className="text-sm text-gray-500">{transaction.fuel_requests?.vehicles?.driver_name}</p>
                    <p className="text-sm text-gray-600">{transaction.fuel_requests?.fuel_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{transaction.fuel_given}L</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(transaction.transaction_date), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, color }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900'
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

export default GasStaffDashboard
