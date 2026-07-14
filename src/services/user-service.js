import { supabase } from "./supabase-client.js";

const ADMIN_PROFILE_COLS =
  "id, full_name, phone, address, role, avatar_url, created_at, updated_at";

/**
 * List all user profiles for admin use.
 * @param {{ order?: 'asc'|'desc' }} options
 * @returns {Promise<Array>}
 */
export async function listUsers({ order = "desc" } = {}) {
  const { data, error } = await supabase
    .from("profiles")
    .select(ADMIN_PROFILE_COLS)
    .order("created_at", { ascending: order === "asc" });

  if (error) throw new Error(`Failed to load users: ${error.message}`);
  return data ?? [];
}

/**
 * Update a user profile (admin). Can change name, role, phone, address.
 * @param {string} id  uuid of the profile row
 * @param {Object} payload
 * @returns {Promise<Object>} updated row
 */
export async function updateUserProfile(id, payload) {
  const full_name = String(payload.full_name ?? "").trim();
  const role = payload.role === "administrator" ? "administrator" : "customer";
  const phone = String(payload.phone ?? "").trim() || null;
  const address = String(payload.address ?? "").trim() || null;

  if (full_name.length < 2) {
    throw new Error("Full name must be at least 2 characters.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name, role, phone, address })
    .eq("id", id)
    .select(ADMIN_PROFILE_COLS)
    .single();

  if (error) throw new Error(`Failed to update user: ${error.message}`);
  return data;
}

/**
 * Delete a user profile. Removing the profile row revokes app access
 * but does not delete the Supabase Auth account (requires service-role API).
 * @param {string} id  uuid of the profile row
 * @returns {Promise<void>}
 */
export async function deleteUserProfile(id) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete user: ${error.message}`);
}
