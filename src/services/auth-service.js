import { supabase } from "./supabase-client.js";

const PROFILE_COLUMNS = "id, full_name, phone, address, role, avatar_url, created_at, updated_at";

async function upsertOwnProfile(userId, payload = {}) {
  const fullName = String(payload.full_name || "").trim() || "New User";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        role: "customer",
        full_name: fullName,
        phone: payload.phone ?? null,
        address: payload.address ?? null,
      },
      { onConflict: "id" }
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}

export async function signInWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  // Fallback to keep signup resilient even if DB trigger/profile row is missing.
  if (data?.session?.user?.id) {
    await upsertOwnProfile(data.session.user.id, { full_name: fullName });
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfileById(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateOwnProfile(userId, payload) {
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data;
  }

  // If no profile exists yet, create it and continue transparently.
  return upsertOwnProfile(userId, payload);
}
