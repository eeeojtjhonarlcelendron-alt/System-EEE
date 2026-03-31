import { supabase } from '../lib/supabase';

/**
 * Fetch all riders (for admin dashboard)
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function fetchAllRiders() {
  const { data, error } = await supabase
    .from('fuel_management_riders')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Fetch riders by hub ID (for team leader dashboard)
 * @param {number} hubId
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function fetchRidersByHub(hubId) {
  const { data, error } = await supabase
    .from('riders')
    .select('*')
    .eq('hub_id', hubId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Fetch a single rider by ID
 * @param {string} riderId
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function fetchRiderById(riderId) {
  const { data, error } = await supabase
    .from('fuel_management_riders')
    .select('*')
    .eq('id', riderId)
    .single();

  return { data, error };
}

/**
 * Create a new rider
 * @param {Object} riderData
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createRider(riderData) {
  const { data, error } = await supabase
    .from('fuel_management_riders')
    .insert([{
      ...riderData,
      qr_code: `RIDER_${Date.now()}_${riderData.fleet_type}`
    }])
    .select()
    .single();

  return { data, error };
}

/**
 * Update a rider
 * @param {string} riderId
 * @param {Object} updates
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateRider(riderId, updates) {
  const { data, error } = await supabase
    .from('fuel_management_riders')
    .update(updates)
    .eq('id', riderId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a rider
 * @param {string} riderId
 * @returns {Promise<{error: Error}>}
 */
export async function deleteRider(riderId) {
  const { error } = await supabase
    .from('fuel_management_riders')
    .delete()
    .eq('id', riderId);

  return { error };
}

/**
 * Validate QR code
 * @param {string} qrCode
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function validateQRCode(qrCode) {
  const { data, error } = await supabase
    .from('riders')
    .select('*')
    .eq('qr_code', qrCode)
    .single();

  return { data, error };
}
