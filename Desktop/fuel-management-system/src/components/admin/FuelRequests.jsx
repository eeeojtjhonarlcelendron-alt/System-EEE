import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { Search, Download, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function FuelRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedQR, setSelectedQR] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_requests')
        .select(`
          *,
          vehicles (plate_number, driver_name),
          users (name),
          fuel_transactions (
            fuel_given,
            transaction_date,
            users (name)
          )
        `)
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

  const getQRData = (request) => {
    return JSON.stringify({
      request_id: request.id,
      vehicle: request.vehicles?.plate_number,
      fuel_type: request.fuel_type,
      liters: request.liters,
      status: request.status,
      qr_code: request.qr_code
    })
  }

  const downloadQR = (request) => {
    const canvas = document.getElementById(`qr-${request.id}`)
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `QR-${request.vehicles?.plate_number}-${request.qr_code}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.vehicles?.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicles?.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.qr_code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Fuel Requests</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle, driver, or QR code..."
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
          <option value="unused">Unused</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liters</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  No requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {request.qr_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.vehicles?.plate_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.vehicles?.driver_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.fuel_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.liters} L
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
                    {format(new Date(request.date_created), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.date_used 
                      ? format(new Date(request.date_used), 'MMM dd, yyyy HH:mm')
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelectedQR(request)}
                      className="text-primary-600 hover:text-primary-800 mr-3"
                      title="View QR Code"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    {request.status === 'unused' && (
                      <button
                        onClick={() => downloadQR(request)}
                        className="text-green-600 hover:text-green-800"
                        title="Download QR"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">QR Code</h3>
              <button
                onClick={() => setSelectedQR(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <QRCodeSVG
                id={`qr-${selectedQR.id}`}
                value={getQRData(selectedQR)}
                size={200}
                level="H"
                includeMargin={true}
              />
              <div className="mt-4 text-center">
                <p className="font-medium text-gray-900">{selectedQR.vehicles?.plate_number}</p>
                <p className="text-sm text-gray-600">{selectedQR.fuel_type} - {selectedQR.liters}L</p>
                <p className="text-xs text-gray-500 mt-1">QR: {selectedQR.qr_code}</p>
              </div>
              {selectedQR.status === 'unused' && (
                <button
                  onClick={() => downloadQR(selectedQR)}
                  className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FuelRequests
