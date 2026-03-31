import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function ExcelImport() {
  const [data, setData] = useState([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check if it's an Excel file
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Please upload an Excel file (.xlsx, .xls) or CSV file')
      return
    }

    setFileName(file.name)
    setLoading(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const binaryString = event.target.result
        const workbook = XLSX.read(binaryString, { type: 'binary' })
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[worksheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length === 0) {
          toast.error('The file appears to be empty')
          setLoading(false)
          return
        }

        setData(jsonData)
        setPreview(true)
        toast.success(`File "${file.name}" loaded successfully! Found ${jsonData.length} rows.`)
      } catch (error) {
        console.error('Error parsing file:', error)
        toast.error('Error reading file. Please check the file format.')
      } finally {
        setLoading(false)
      }
    }

    reader.onerror = () => {
      toast.error('Error reading file')
      setLoading(false)
    }

    reader.readAsBinaryString(file)
  }

  const processImport = () => {
    // This is where you would process the data and save to database
    toast.success(`Processing ${data.length} rows...`)
    
    // Example: Log the data
    console.log('Data to import:', data)
    
    // Reset after import
    setData([])
    setFileName('')
    setPreview(false)
    toast.success('Import completed!')
  }

  const clearFile = () => {
    setData([])
    setFileName('')
    setPreview(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Excel File</h2>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <FileSpreadsheet className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel File</h3>
          <p className="text-gray-500 mb-6">Support for .xlsx, .xls, and .csv files</p>

          <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Upload className="w-5 h-5" />
            <span>Select File</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* File Info */}
        {fileName && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-900">{fileName}</p>
              <p className="text-sm text-green-700">{data.length} rows loaded</p>
            </div>
            <button
              onClick={clearFile}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Reading file...</p>
          </div>
        )}
      </div>

      {/* Data Preview */}
      {preview && data.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
            <span className="text-sm text-gray-500">Showing first 10 rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {data[0]?.map((header, index) => (
                    <th
                      key={index}
                      className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700"
                    >
                      {header || `Column ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(1, 11).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border border-gray-200 px-4 py-2 text-sm text-gray-600"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length > 11 && (
            <p className="text-center text-gray-500 mt-4">
              ... and {data.length - 11} more rows
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Instructions</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Upload an Excel file with headers in the first row</li>
              <li>• Supported formats: .xlsx, .xls, .csv</li>
              <li>• Preview your data before importing</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {preview && data.length > 0 && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={clearFile}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={processImport}
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Import Data
          </button>
        </div>
      )}
    </div>
  )
}

export default ExcelImport
