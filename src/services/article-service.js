import { supabase } from "./supabase-client.js";

/**
 * Fetch all published articles ordered by newest first.
 * @returns {Promise<Array>}
 */
export async function getPublishedArticles() {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, summary, content, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetch a single article by slug. Returns null when not found.
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getArticleBySlug(slug) {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, summary, content, image_url, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load article: ${error.message}`);
  }

  return data ?? null;
}

// ─── Admin CRUD ───────────────────────────────────────────

/**
 * Validate and normalize a write payload. Throws on invalid input.
 * @param {Object} payload
 * @returns {Object} row ready to send to Supabase
 */
function normalizePayload(payload) {
  const title = String(payload.title ?? "").trim();
  const slug = String(payload.slug ?? "").trim();
  const content = String(payload.content ?? "").trim();
  const summary = String(payload.summary ?? "").trim() || null;
  const image_url = String(payload.image_url ?? "").trim() || null;

  if (!title) throw new Error("Title is required.");
  if (!slug) throw new Error("Slug is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      "Slug must use lowercase letters, numbers and hyphens only (e.g. my-article-title)."
    );
  }
  if (!content) throw new Error("Content is required.");

  return { title, slug, content, summary, image_url };
}

/**
 * List all articles for admin use (includes updated_at).
 * @param {{ order?: 'asc'|'desc' }} options
 * @returns {Promise<Array>}
 */
export async function listArticles({ order = "desc" } = {}) {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, summary, content, image_url, created_at, updated_at")
    .order("created_at", { ascending: order === "asc" });

  if (error) throw new Error(`Failed to list articles: ${error.message}`);
  return data ?? [];
}

/**
 * Fetch a single article by id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getArticleById(id) {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, summary, content, image_url, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load article: ${error.message}`);
  return data ?? null;
}

/**
 * Create a new article. Throws on validation failure or DB error.
 * @param {Object} payload
 * @returns {Promise<Object>} the created article row
 */
export async function createArticle(payload) {
  const row = normalizePayload(payload);

  const { data, error } = await supabase
    .from("articles")
    .insert(row)
    .select("id, title, slug, summary, content, image_url, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That slug is already in use. Choose a different slug.");
    }
    throw new Error(`Failed to create article: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing article by id. Throws on validation failure or DB error.
 * @param {string} id
 * @param {Object} payload
 * @returns {Promise<Object>} the updated article row
 */
export async function updateArticle(id, payload) {
  const row = normalizePayload(payload);

  const { data, error } = await supabase
    .from("articles")
    .update(row)
    .eq("id", id)
    .select("id, title, slug, summary, content, image_url, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That slug is already in use. Choose a different slug.");
    }
    throw new Error(`Failed to update article: ${error.message}`);
  }

  return data;
}

/**
 * Delete an article by id.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteArticle(id) {
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete article: ${error.message}`);
}
