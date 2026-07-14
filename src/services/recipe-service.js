import { supabase } from "./supabase-client.js";

// ─── Public read ───────────────────────────────────────────

/**
 * Fetch all recipes ordered by newest first (public view).
 * @returns {Promise<Array>}
 */
export async function getPublishedRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, slug, description, content, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load recipes: ${error.message}`);
  return data ?? [];
}

/**
 * Fetch a single recipe by slug. Returns null when not found.
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getRecipeBySlug(slug) {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, slug, description, content, image_url, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load recipe: ${error.message}`);
  return data ?? null;
}

// ─── Admin CRUD ────────────────────────────────────────────

/**
 * Validate and normalize a write payload. Throws on invalid input.
 * @param {Object} payload
 * @returns {Object} row ready for Supabase
 */
function normalizePayload(payload) {
  const title = String(payload.title ?? "").trim();
  const slug = String(payload.slug ?? "").trim();
  const content = String(payload.content ?? "").trim();
  const description = String(payload.description ?? "").trim() || null;
  const image_url = String(payload.image_url ?? "").trim() || null;

  if (!title) throw new Error("Title is required.");
  if (!slug) throw new Error("Slug is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      "Slug must use lowercase letters, numbers and hyphens only (e.g. my-recipe-title)."
    );
  }
  if (!content) throw new Error("Content is required.");

  return { title, slug, content, description, image_url };
}

/**
 * List all recipes for admin use (includes updated_at).
 * @param {{ order?: 'asc'|'desc' }} options
 * @returns {Promise<Array>}
 */
export async function listRecipes({ order = "desc" } = {}) {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, slug, description, content, image_url, created_at, updated_at")
    .order("created_at", { ascending: order === "asc" });

  if (error) throw new Error(`Failed to list recipes: ${error.message}`);
  return data ?? [];
}

/**
 * Fetch a single recipe by id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getRecipeById(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, slug, description, content, image_url, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load recipe: ${error.message}`);
  return data ?? null;
}

/**
 * Create a new recipe. Throws on validation failure or DB error.
 * @param {Object} payload
 * @returns {Promise<Object>} the created recipe row
 */
export async function createRecipe(payload) {
  const row = normalizePayload(payload);

  const { data, error } = await supabase
    .from("recipes")
    .insert(row)
    .select("id, title, slug, description, content, image_url, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That slug is already in use. Choose a different slug.");
    }
    throw new Error(`Failed to create recipe: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing recipe by id. Throws on validation failure or DB error.
 * @param {string} id
 * @param {Object} payload
 * @returns {Promise<Object>} the updated recipe row
 */
export async function updateRecipe(id, payload) {
  const row = normalizePayload(payload);

  const { data, error } = await supabase
    .from("recipes")
    .update(row)
    .eq("id", id)
    .select("id, title, slug, description, content, image_url, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That slug is already in use. Choose a different slug.");
    }
    throw new Error(`Failed to update recipe: ${error.message}`);
  }

  return data;
}

/**
 * Delete a recipe by id.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteRecipe(id) {
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete recipe: ${error.message}`);
}
