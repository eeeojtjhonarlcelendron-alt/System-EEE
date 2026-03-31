import { supabase } from '../lib/supabase';

/**
 * Fetch all users from the database
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Create a new user directly in the database
 * @param {Object} userData - { name, email, password, role, hub_id }
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createUser(userData) {
  try {
    // Generate UUID for the user
    const userId = crypto.randomUUID();
    
    // Insert into public.users table
    const { data: userDataResult, error: insertError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        hub_id: userData.hub_id || null,
      }])
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError };
    }

    return { data: userDataResult, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Delete a user from public.users table
 * @param {string} userId
 * @returns {Promise<{error: Error}>}
 */
export async function deleteUser(userId) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  return { error };
}
