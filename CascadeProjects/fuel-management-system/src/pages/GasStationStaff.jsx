import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { QRCodeSVG } from 'qrcode.react';
import { Scan, CheckCircle, XCircle, Fuel, User, ArrowLeft, LogOut, AlertCircle } from 'lucide-react';

export default function GasStationStaff() {
  const { user, logout } = useAuth();
  const { riders, gasStations, validateQRCode, addFuelTransaction } = useData();
  const [scanMode, setScanMode] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [validatedRider, setValidatedRider] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const station = gasStations.find(s => s.id === user?.stationId);

  const handleValidateQR = () => {
    setValidationError('');
    const result = validateQRCode(qrInput.trim());
    
    if (result.valid) {
      setValidatedRider(result.rider);
      if (result.rider.isLHDriver) {
        setFuelAmount('Full Tank');
      } else {
        setFuelAmount('');
      }
    } else {
      setValidationError(result.error);
      setValidatedRider(null);
    }
  };

  const handleProcessFuel = () => {
    if (!validatedRider) return;
    
    setProcessing(true);
    
    const amount = validatedRider.isLHDriver ? 50 : parseInt(fuelAmount);
    
    if (!validatedRider.isLHDriver && (isNaN(amount) || amount <= 0 || amount > validatedRider.credit)) {
      setValidationError('Invalid fuel amount or insufficient credit');
      setProcessing(false);
      return;
    }

    addFuelTransaction({
      riderId: validatedRider.id,
      riderName: validatedRider.name,
      stationId: station?.id,
      stationName: station?.name,
      amount: amount,
      type: validatedRider.isLHDriver ? 'full_tank' : 'credit',
    });

    setSuccess(true);
    setProcessing(false);
    
    setTimeout(() => {
      resetForm();
    }, 3000);
  };

  const resetForm = () => {
    setQrInput('');
    setValidatedRider(null);
    setValidationError('');
    setFuelAmount('');
    setSuccess(false);
    setScanMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gas Station Staff</h1>
              <p className="text-sm text-gray-500">{station?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fuel Dispensed!</h2>
            <p className="text-gray-600 mb-6">
              {validatedRider?.isLHDriver 
                ? `Full tank dispensed for ${validatedRider?.name}`
                : `${fuelAmount}L dispensed for ${validatedRider?.name}`
              }
            </p>
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Process Next Rider
            </button>
          </div>
        ) : !scanMode ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan QR Code</h2>
              <p className="text-gray-500">Enter the rider's QR code to validate and process fuel</p>
            </div>

            <button
              onClick={() => setScanMode(true)}
              className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors"
            >
              Start Scanning
            </button>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Instructions:</p>
                  <ol className="text-sm text-yellow-700 mt-1 space-y-1 list-decimal list-inside">
                    <li>Ask rider to show their QR code</li>
                    <li>Enter the QR code manually or scan</li>
                    <li>System validates the code</li>
                    <li>LH Drivers get full tank automatically</li>
                    <li>Regular drivers: enter fuel amount based on credit</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : !validatedRider ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setScanMode(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter QR Code</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Scan or type QR code..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-mono focus:ring-2 focus:ring-primary outline-none"
                autoFocus
              />
              
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  {validationError}
                </div>
              )}

              <button
                onClick={handleValidateQR}
                disabled={!qrInput.trim()}
                className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Validate QR Code
              </button>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-3">Or select from registered riders:</p>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-200">
                {riders.map(rider => (
                  <button
                    key={rider.id}
                    onClick={() => {
                      setQrInput(rider.qrCode);
                      handleValidateQR();
                    }}
                    className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{rider.name}</p>
                        <p className="text-sm text-gray-500">{rider.isLHDriver ? 'LH Driver' : `Credit: ₱${rider.credit}`}</p>
                      </div>
                    </div>
                    <QRCodeSVG value={rider.qrCode} size={40} level="L" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setValidatedRider(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Valid QR Code</h2>
              <p className="text-gray-500">Rider verified successfully</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-lg">{validatedRider.name}</p>
                  <p className="text-gray-500">{validatedRider.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      validatedRider.isLHDriver ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {validatedRider.isLHDriver ? 'LH Driver - Full Tank' : 'Regular Driver'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Fuel Allocation</h3>
              
              {validatedRider.isLHDriver ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fuel className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Full Tank</span>
                    </div>
                    <span className="text-green-700">~50 Liters</span>
                  </div>
                  <p className="text-sm text-green-700 mt-2">LH Driver privilege - No credit limit</p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Available Credit:</span>
                    <span className="font-semibold text-gray-900">₱{validatedRider.credit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={fuelAmount}
                      onChange={(e) => setFuelAmount(e.target.value)}
                      placeholder="Enter liters"
                      max={validatedRider.credit}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    />
                    <span className="text-gray-500">Liters</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Max: {validatedRider.credit}L (based on credit)</p>
                </div>
              )}

              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  {validationError}
                </div>
              )}

              <button
                onClick={handleProcessFuel}
                disabled={processing || (!validatedRider.isLHDriver && !fuelAmount)}
                className="w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Processing...' : 'Dispense Fuel'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
