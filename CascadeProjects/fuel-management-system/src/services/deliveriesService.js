import { supabase } from '../lib/supabase';

/**
 * Parse CSV data for daily deliveries
 * Expected format: DATE, RIDER ID, RIDER NAME, FLEET TYPE, OPERATOR HUB
 * @param {string} csvContent
 * @returns {Array} Parsed rows
 */
export function parseDeliveryCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Validate headers
  const requiredHeaders = ['date', 'rider id', 'rider name', 'fleet type', 'operator hub'];
  const hasAllHeaders = requiredHeaders.every(h => 
    headers.some(header => header.includes(h.replace(' ', '')) || header.includes(h))
  );
  
  if (!hasAllHeaders) {
    throw new Error('CSV must contain: DATE, RIDER ID, RIDER NAME, FLEET TYPE, OPERATOR HUB columns');
  }
  
  const deliveries = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 5) continue;
    
    const fleetType = normalizeFleetType(values[3]);
    
    deliveries.push({
      date: parseDate(values[0]),
      rider_id: values[1],
      rider_name: values[2],
      fleet_type: fleetType,
      hub_name: values[4],
    });
  }
  
  return deliveries;
}

/**
 * Normalize fleet type values
 * @param {string} value
 * @returns {string}
 */
function normalizeFleetType(value) {
  const lower = value.toLowerCase().trim();
  if (lower.includes('2') || lower.includes('two')) return '2_wheels';
  if (lower.includes('3') || lower.includes('three')) return '3_wheels';
  if (lower.includes('4') || lower.includes('four')) return '4_wheels';
  if (lower.includes('line') || lower.includes('haul') || lower.includes('lh')) return 'line_haul';
  return '2_wheels'; // default
}

/**
 * Parse date from various formats
 * @param {string} dateStr
 * @returns {string} ISO date string
 */
function parseDate(dateStr) {
  // Try common date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Try DD/MM/YYYY format
  const parts = dateStr.split(/[/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }
  
  // Default to today
  return new Date().toISOString().split('T')[0];
}

/**
 * Import daily deliveries to database
 * @param {Array} deliveries
 * @param {number} hubId
 * @returns {Promise<{success: number, errors: Array}>}
 */
export async function importDailyDeliveries(deliveries, hubId) {
  const batchId = crypto.randomUUID();
  const results = { success: 0, errors: [] };
  
  console.log('Importing deliveries:', deliveries.length, 'for hub:', hubId);
  
  for (const delivery of deliveries) {
    console.log('Inserting delivery:', delivery);
    const { data, error } = await supabase
      .from('daily_deliveries')
      .insert([{
        ...delivery,
        hub_id: hubId,
        import_batch_id: batchId,
      }])
      .select();
    
    if (error) {
      console.error('Insert error:', error);
      results.errors.push({ rider: delivery.rider_id, error: error.message });
    } else {
      console.log('Insert success:', data);
      results.success++;
    }
  }
  
  return { data: { batchId, ...results }, error: results.errors.length > 0 ? results.errors : null };
}

/**
 * Fetch daily deliveries for a hub on a specific date
 * @param {number} hubId
 * @param {string} date - ISO date string
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchDailyDeliveries(hubId, date) {
  console.log('Fetching deliveries for hub:', hubId, 'date:', date);
  const { data, error } = await supabase
    .from('daily_deliveries')
    .select('*')
    .eq('hub_id', hubId)
    .eq('date', date)
    .order('rider_name');

  console.log('Fetch result:', { data, error });
  return { data, error };
}

/**
 * Fetch all daily deliveries for a hub (for debugging)
 * @param {number} hubId
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchAllDailyDeliveries(hubId) {
  const { data, error } = await supabase
    .from('daily_deliveries')
    .select('*')
    .eq('hub_id', hubId)
    .order('created_at', { ascending: false })
    .limit(10);

  return { data, error };
}

/**
 * Delete imported batch
 * @param {string} batchId
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteImportBatch(batchId) {
  const { error } = await supabase
    .from('daily_deliveries')
    .delete()
    .eq('import_batch_id', batchId);

  return { error };
}
