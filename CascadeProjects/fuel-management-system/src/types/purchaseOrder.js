/**
 * @typedef {Object} PurchaseOrder
 * @property {string} id
 * @property {string} created_at
 * @property {string} date
 * @property {string} po_number
 * @property {string} rider_id
 * @property {string} rider_name
 * @property {'2_wheels' | '3_wheels' | '4_wheels' | 'LH'} fleet_type
 * @property {string} operator_hub
 * @property {'Active' | 'Used'} status
 * @property {string | null} receipt_url
 * @property {string | null} qr_code
 * @property {string | null} created_by
 */

// Fleet type options for dropdowns
export const FLEET_TYPES = [
  { value: '2_wheels', label: '2 Wheels' },
  { value: '3_wheels', label: '3 Wheels' },
  { value: '4_wheels', label: '4 Wheels' },
  { value: 'LH', label: 'LH' },
];

// Status options
export const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Used', label: 'Used' },
];

// Helper function to format PO number for display
export function formatPONumber(poNumber) {
  return poNumber;
}

// Helper function to get status badge color
export function getStatusColor(status) {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-700';
    case 'Used':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
