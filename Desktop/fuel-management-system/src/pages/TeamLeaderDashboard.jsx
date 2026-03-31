import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Search, Download, QrCode, History, Fuel, Car, AlertCircle, X } from 'lucide-react'
import { format, addHours } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import ExcelImport from '../components/team-leader/ExcelImport'

function TeamLeaderDashboard() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/create-po" element={<CreateFuelPO />} />
      <Route path="/history" element={<RequestHistory />} />
      <Route path="/riders" element={<RidersPage />} />
    </Routes>
  )
}

// Dashboard Home
function DashboardHome() {
  console.log('DashboardHome rendering')
  return (
    <div style={{padding: '20px'}}>
      <h1 style={{color: 'red', fontSize: '30px'}}>DASHBOARD HOME IS WORKING!</h1>
      <p>Team Leader Dashboard Loaded Successfully</p>
    </div>
  )
}

// Create Fuel PO
function CreateFuelPO() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [generatedQR, setGeneratedQR] = useState(null)

  const [formData, setFormData] = useState({
    vehicle_type: '',
    fuel_type: 'diesel',
    liters: 50,
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate unique QR code
      const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Calculate expiration (24 hours from now)
      const expiresAt = addHours(new Date(), 24).toISOString()

      // Create fuel request
      const { data, error } = await supabase
        .from('fuel_requests')
        .insert([{
          vehicle_type: formData.vehicle_type,
          fuel_type: formData.fuel_type,
          liters: formData.liters,
          created_by: user?.id,
          qr_code: qrCode,
          status: 'unused',
          expires_at: expiresAt,
          notes: formData.notes
        }])
        .select(`
          *,
          vehicles (plate_number, driver_name)
        `)
        .single()

      if (error) throw error

      setGeneratedQR(data)
      setShowQR(true)
      toast.success('Fuel PO created successfully!')

      // Reset form
      setFormData({
        vehicle_type: '',
        fuel_type: 'diesel',
        liters: 50,
        notes: ''
      })
    } catch (error) {
      console.error('Error creating fuel request:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    const canvas = document.getElementById('generated-qr')
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `QR-${generatedQR?.vehicles?.plate_number}-${generatedQR?.qr_code}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  const getQRData = () => {
    if (!generatedQR) return ''
    return JSON.stringify({
      request_id: generatedQR.id,
      vehicle: generatedQR.vehicles?.plate_number,
      fuel_type: generatedQR.fuel_type,
      liters: generatedQR.liters,
      status: generatedQR.status,
      qr_code: generatedQR.qr_code
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Fuel Purchase Order</h2>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="w-4 h-4 inline mr-1" />
                Vehicle Type
              </label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select vehicle type...</option>
                <option value="2_wheels">2 Wheels</option>
                <option value="4_wheels">4 Wheels</option>
                <option value="3_wheels">3 Wheels</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Fuel className="w-4 h-4 inline mr-1" />
                  Fuel Type
                </label>
                <select
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="diesel">Diesel</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Liters)
                </label>
                <input
                  type="number"
                  value={formData.liters}
                  onChange={(e) => setFormData({ ...formData, liters: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                  min="1"
                  max="200"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows="3"
                placeholder="Any additional information..."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important:</p>
                <p>QR code will expire in 24 hours. Download and share it with the driver immediately.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Generate QR Code
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && generatedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">QR Code Generated!</h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              <QRCodeSVG
                id="generated-qr"
                value={getQRData()}
                size={250}
                level="H"
                includeMargin={true}
              />
              
              <div className="mt-6 text-center">
                <p className="font-bold text-lg text-gray-900">{generatedQR.vehicles?.plate_number}</p>
                <p className="text-gray-600">{generatedQR.fuel_type} - {generatedQR.liters} Liters</p>
                <p className="text-sm text-gray-500 mt-2">Driver: {generatedQR.vehicles?.driver_name}</p>
                <p className="text-xs text-gray-400 mt-4 font-mono">{generatedQR.qr_code}</p>
                <p className="text-xs text-red-500 mt-2">Expires: {format(new Date(generatedQR.expires_at), 'MMM dd, yyyy HH:mm')}</p>
              </div>

              <button
                onClick={downloadQR}
                className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Request History
function RequestHistory() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_requests')
        .select(`
          *,
          vehicles (plate_number, driver_name)
        `)
        .eq('created_by', user?.id)
        .order('date_created', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.vehicles?.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicles?.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Fuel Request History</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle or driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Status</option>
          <option value="unused">Active (Unused)</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No requests found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      request.status === 'unused' ? 'bg-blue-100 text-blue-600' : 
                      request.status === 'used' ? 'bg-green-100 text-green-600' : 
                      'bg-red-100 text-red-600'
                    }`}>
                      <Fuel className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{request.vehicles?.plate_number}</p>
                      <p className="text-sm text-gray-500">{request.vehicles?.driver_name}</p>
                      <p className="text-sm text-gray-600">{request.fuel_type} - {request.liters}L</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'unused'
                        ? 'bg-blue-100 text-blue-800'
                        : request.status === 'used'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {format(new Date(request.date_created), 'MMM dd, yyyy HH:mm')}
                    </p>
                    {request.date_used && (
                      <p className="text-xs text-green-600 mt-1">
                        Used: {format(new Date(request.date_used), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
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
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

// Riders Page with Import Function
function RidersPage() {
  const [riders, setRiders] = useState([])
  const [showImport, setShowImport] = useState(false)

  const handleImportComplete = (data) => {
    const importedRiders = data.slice(1).map((row, index) => ({
      id: index + 1,
      name: row[0] || '',
      phone: row[1] || '',
      vehicle: row[2] || '',
      plateNumber: row[3] || ''
    }))
    setRiders(importedRiders)
    setShowImport(false)
    toast.success(`${importedRiders.length} riders imported!`)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Riders</h2>
        <button
          onClick={() => setShowImport(!showImport)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showImport ? 'Hide Import' : 'Import from Excel'}
        </button>
      </div>

      {showImport && (
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <ExcelImport onImportComplete={handleImportComplete} />
        </div>
      )}

      {riders.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Plate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {riders.map((rider) => (
                <tr key={rider.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{rider.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{rider.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{rider.vehicle}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{rider.plateNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No riders yet.</p>
          <p className="text-sm text-gray-400 mt-2">Click "Import from Excel" to add riders</p>
        </div>
      )}
    </div>
  )
}

export default TeamLeaderDashboard
