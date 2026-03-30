import { supabase } from '../lib/supabase';

/**
 * Fetch all fuel transactions from the database
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchAllFuelTransactions() {
  const { data, error } = await supabase
    .from('fuel_transactions')
    .select(`
      *,
      stations:station_id (name)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Fetch fuel transactions by hub ID
 * @param {number} hubId
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchFuelTransactionsByHub(hubId) {
  const { data, error } = await supabase
    .from('fuel_transactions')
    .select(`
      *,
      stations:station_id (name)
    `)
    .eq('hub_id', hubId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Fetch fuel transactions by rider ID
 * @param {string} riderId
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchFuelTransactionsByRider(riderId) {
  const { data, error } = await supabase
    .from('fuel_transactions')
    .select(`
      *,
      stations:station_id (name)
    `)
    .eq('rider_id', riderId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Create a new fuel transaction
 * @param {Object} transaction
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createFuelTransaction(transaction) {
  const { data, error } = await supabase
    .from('fuel_transactions')
    .insert([transaction])
    .select()
    .single();

  return { data, error };
}

/**
 * Get fuel transaction statistics for a hub
 * @param {number} hubId
 * @returns {Promise<{totalFuel: number, fullTankCount: number, creditCount: number, error: Error|null}>}
 */
export async function getFuelStatsByHub(hubId) {
  const { data, error } = await supabase
    .from('fuel_transactions')
    .select('amount, type')
    .eq('hub_id', hubId);

  if (error) {
    return { totalFuel: 0, fullTankCount: 0, creditCount: 0, error };
  }

  const totalFuel = data.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const fullTankCount = data.filter(t => t.type === 'full_tank').length;
  const creditCount = data.filter(t => t.type === 'credit').length;

  return { totalFuel, fullTankCount, creditCount, error: null };
}
