import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Fuel, LogOut, Clock, CreditCard, Truck, Download, QrCode, Users, MapPin, TrendingUp, Upload, FileUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { fetchRidersByHub } from '../services/ridersService';
import { parseDeliveryCSV, importDailyDeliveries, fetchDailyDeliveries, fetchAllDailyDeliveries } from '../services/deliveriesService';

export default function TeamLeaderDashboard() {
  const { user, logout } = useAuth();
  const { hubs, fuelTransactions } = useData();
  const [selectedRider, setSelectedRider] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  
  // State for database riders and daily deliveries
  const [dbRiders, setDbRiders] = useState([]);
  const [dailyDeliveries, setDailyDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch riders from database when hub changes
  useEffect(() => {
    if (user?.hubId) {
      loadRiders();
      loadDailyDeliveries();
    }
  }, [user?.hubId, selectedDate]);

  const loadRiders = async () => {
    setLoading(true);
    const { data, error } = await fetchRidersByHub(user.hubId);
    if (data && !error) {
      setDbRiders(data);
    }
    setLoading(false);
  };

  const loadDailyDeliveries = async () => {
    console.log('Loading daily deliveries for hub:', user.hubId, 'date:', selectedDate);
    const { data, error } = await fetchDailyDeliveries(user.hubId, selectedDate);
    console.log('Loaded deliveries:', data, 'error:', error);
    if (data && !error) {
      setDailyDeliveries(data);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) return;
    
    setImportLoading(true);
    try {
      const deliveries = parseDeliveryCSV(importData);
      const { data, error } = await importDailyDeliveries(deliveries, user.hubId);
      setImportResult({
        success: data?.success || 0,
        errors: data?.errors || [],
        batchId: data?.batchId
      });
      if (!error && data?.success > 0) {
        setImportData('');
        setImportFile(null);
        // Reload deliveries to show imported data
        await loadDailyDeliveries();
        // Close modal after short delay to show success message
        setTimeout(() => {
          setShowImportModal(false);
          setImportResult(null);
        }, 2000);
      }
    } catch (err) {
      setImportResult({
        success: 0,
        errors: [{ error: err.message }],
        batchId: null
      });
    }
    setImportLoading(false);
  };

  const hub = hubs.find(h => h.id === user?.hubId);
  const hubRiders = dbRiders;
  
  const hubTransactions = fuelTransactions.filter(t => 
    hubRiders.some(r => r.id === t.riderId)
  );

  const totalFuelDispensed = hubTransactions.reduce((sum, t) => sum + t.amount, 0);
  const fullTankCount = hubTransactions.filter(t => t.type === 'full_tank').length;
  const creditCount = hubTransactions.filter(t => t.type === 'credit').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Team Leader Dashboard</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {hub?.name || 'Unknown Hub'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Upload className="w-3 h-3" />
              Import
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600">Hub Riders</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{hubRiders.length}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Active riders</p>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-green-100 rounded-md flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-xs text-gray-600">Total Fuel</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{totalFuelDispensed}L</p>
            <p className="text-[10px] text-gray-500 mt-0.5">This month</p>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-orange-100 rounded-md flex items-center justify-center">
                <Fuel className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <span className="text-xs text-gray-600">Full Tank</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{fullTankCount}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">LH refuels</p>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-purple-100 rounded-md flex items-center justify-center">
                <Fuel className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-600">Credit</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{creditCount}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Credit refuels</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Hub Riders</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {hubRiders.map(rider => (
                <div key={rider.id} className="p-2 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rider.name}</p>
                    <p className="text-xs text-gray-500">{rider.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      rider.is_lh_driver ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {rider.is_lh_driver ? 'LH' : 'Regular'}
                    </span>
                    {!rider.is_lh_driver && (
                      <p className="text-xs text-gray-600 mt-0.5">₱{rider.credit}</p>
                    )}
                    <button
                      onClick={() => {
                        setSelectedRider(rider);
                        setShowQRModal(true);
                      }}
                      className="mt-1 flex items-center gap-1 px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-[10px] font-medium transition-colors"
                    >
                      <QrCode className="w-2.5 h-2.5" />
                      QR
                    </button>
                  </div>
                </div>
              ))}
              {hubRiders.length === 0 && (
                <p className="p-4 text-center text-sm text-gray-500">No riders</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Recent Fuel Transactions</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {hubTransactions.slice(0, 10).map(transaction => (
                <div key={transaction.id} className="p-2 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.riderName}</p>
                      <p className="text-xs text-gray-500">{transaction.stationName}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      transaction.type === 'full_tank' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {transaction.type === 'full_tank' ? 'Full' : 'Credit'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-400">{transaction.date}</span>
                    <span className="text-sm font-semibold text-gray-900">{transaction.amount}L</span>
                  </div>
                </div>
              ))}
              {hubTransactions.length === 0 && (
                <p className="p-4 text-center text-sm text-gray-500">No transactions</p>
              )}
            </div>
          </div>
        </div>

        {/* Daily Deliveries Section */}
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Daily Deliveries</h2>
              <button
                onClick={async () => {
                  const { data } = await fetchAllDailyDeliveries(user.hubId);
                  if (data) setDailyDeliveries(data);
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Show All
              </button>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Rider ID</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Fleet</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Hub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dailyDeliveries.map(delivery => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{delivery.date}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{delivery.rider_id}</td>
                    <td className="px-3 py-2 text-gray-600">{delivery.rider_name}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                        delivery.fleet_type === 'line_haul' ? 'bg-green-100 text-green-700' :
                        delivery.fleet_type === '4_wheels' ? 'bg-orange-100 text-orange-700' :
                        delivery.fleet_type === '3_wheels' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {delivery.fleet_type === '2_wheels' && '2W'}
                        {delivery.fleet_type === '3_wheels' && '3W'}
                        {delivery.fleet_type === '4_wheels' && '4W'}
                        {delivery.fleet_type === 'line_haul' && 'LH'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{delivery.hub_name}</td>
                  </tr>
                ))}
                {dailyDeliveries.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-3 py-4 text-center text-xs text-gray-500">
                      No deliveries for {selectedDate}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showQRModal && selectedRider && (
        <QRCodeModal
          rider={selectedRider}
          onClose={() => {
            setShowQRModal(false);
            setSelectedRider(null);
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          importFile={importFile}
          setImportFile={setImportFile}
          importData={importData}
          setImportData={setImportData}
          onClose={() => {
            setShowImportModal(false);
            setImportResult(null);
            setImportFile(null);
            setImportData('');
          }}
          onImport={handleImport}
          importLoading={importLoading}
          importResult={importResult}
          user={user}
        />
      )}
    </div>
  );
}

function QRCodeModal({ rider, onClose }) {
  const handleDownloadQR = () => {
    const svg = document.getElementById('rider-qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-code-${rider.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{rider.name}'s QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-100 mb-4">
            <QRCodeSVG
              id="rider-qr-code"
              value={rider.qr_code || 'RIDER_NULL'}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ importFile, setImportFile, importData, setImportData, onClose, onImport, importLoading, importResult, user }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportData(event.target.result);
      };
      reader.readAsText(file);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Import Daily Deliveries</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Upload CSV or Excel file with columns: <strong>DATE, RIDER ID, RIDER NAME, FLEET TYPE, OPERATOR HUB</strong>
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {importFile ? importFile.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                CSV, Excel (.xlsx, .xls) up to 10MB
              </p>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Fleet Type: 2 wheels, 3 wheels, 4 wheels, Line Haul
            </p>
            <button
              onClick={() => {
                const template = `DATE,RIDER ID,RIDER NAME,FLEET TYPE,OPERATOR HUB
${new Date().toISOString().split('T')[0]},RID001,John Doe,2 wheels,${user?.hubName || 'Your Hub'}
${new Date().toISOString().split('T')[0]},RID002,Jane Smith,Line Haul,${user?.hubName || 'Your Hub'}
${new Date().toISOString().split('T')[0]},RID003,Mike Johnson,4 wheels,${user?.hubName || 'Your Hub'}`;
                const blob = new Blob([template], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'daily-deliveries-template.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Download Template
            </button>
          </div>
        </div>

        {importResult && (
          <div className={`mt-4 p-3 rounded-lg ${importResult.errors.length > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <p className="font-medium text-sm">
              {importResult.errors.length > 0 ? (
                <span className="text-yellow-700">
                  Imported {importResult.success} records. {importResult.errors.length} errors.
                </span>
              ) : (
                <span className="text-green-700">
                  Successfully imported {importResult.success} records!
                </span>
              )}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 text-xs text-yellow-600 max-h-24 overflow-y-auto">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err.rider}: {err.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            disabled={importLoading || !importFile}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4" />
                Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
