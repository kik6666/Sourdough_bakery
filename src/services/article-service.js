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
