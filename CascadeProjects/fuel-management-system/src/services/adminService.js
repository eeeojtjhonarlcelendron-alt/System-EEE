import { supabase } from '../lib/supabase';

/**
 * Fetch all team leaders from the database
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchAllTeamLeaders() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'team_leader')
    .order('name');

  return { data, error };
}

/**
 * Fetch team leaders by hub ID
 * @param {number} hubId
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchTeamLeadersByHub(hubId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'team_leader')
    .eq('hub_id', hubId)
    .order('name');

  return { data, error };
}

/**
 * Create a new team leader
 * @param {Object} teamLeader
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createTeamLeader(teamLeader) {
  const { data, error } = await supabase
    .from('team_leaders')
    .insert([teamLeader])
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a team leader
 * @param {string} id
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteTeamLeader(id) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
    .eq('role', 'team_leader');

  return { error };
}

/**
 * Fetch all gas stations from the database
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchAllGasStations() {
  const { data, error } = await supabase
    .from('gas_stations')
    .select('*')
    .order('name');

  return { data, error };
}

/**
 * Create a new gas station
 * @param {Object} gasStation
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createGasStation(gasStation) {
  const { data, error } = await supabase
    .from('gas_stations')
    .insert([gasStation])
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a gas station
 * @param {string} id
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteGasStation(id) {
  const { error } = await supabase
    .from('gas_stations')
    .delete()
    .eq('id', id);

  return { error };
}
