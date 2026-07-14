import template from "./index.html?raw";
import "./styles.css";
import { getRouteParams } from "../../router/router.js";
import { getPublishedArticles } from "../../services/article-service.js";

// ─── constants ────────────────────────────────────────────
const FALLBACK_IMG = "/bread_photos/amiraber-artisan-bread-9860622_1920.jpg";

/**
 * Curated local images per article slug.
 * Takes precedence over the image_url stored in Supabase.
 */
const ARTICLE_IMAGES = {
  "what-makes-sourdough-different":
    "/bread_photos/photostockeditor-bread-9943125_1920.jpg",
  "understanding-hydration-in-bread-dough":
    "/About_strip_section/good_to_know_section/hydration.jpg",
  "how-to-read-fermentation-signs":
    "/bread_photos/sourdough_jar.jpg",
  "flour-types-and-when-to-use-them":
    "/bread_photos/4935210-wheat-3223040_1920.jpg",
  "why-steam-is-crucial-artisan-baking":
    "/bread_photos/amiraber-artisan-bread-9860622_1920.jpg",
  "troubleshooting-dense-loaves":
    "/bread_photos/white_crows_nest-bread-7784892_1920.jpg",
  "how-to-store-bread-for-freshness":
    "/bread_photos/pexels-bread-2178874_1920.jpg",
  "seasonal-baking-calendar-home-bakers":
    "/bread_photos/juliendavid-bakery-567378_1920.jpg",
};

function getArticleImage(article) {
  return ARTICLE_IMAGES[article.slug] || article.image_url || FALLBACK_IMG;
}

// ─── utilities ────────────────────────────────────────────
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getPreview(article) {
  if (article.summary) return article.summary;
  if (article.content) {
    return article.content.length > 140
      ? article.content.slice(0, 140).trimEnd() + "\u2026"
      : article.content;
  }
  return "";
}

// ─── state views ──────────────────────────────────────────
function renderSpinner() {
  return `
    <div class="gtn-state d-flex flex-column align-items-center justify-content-center py-5"
         role="status" aria-label="Loading articles">
      <div class="spinner-border text-secondary mb-3"
           style="width:3rem;height:3rem;" aria-hidden="true"></div>
      <p class="text-muted">Loading articles&hellip;</p>
    </div>
  `;
}

function renderErrorAlert(showRetry) {
  return `
    <div class="container py-5">
      <div class="alert alert-warning d-flex flex-column flex-sm-row align-items-start
                  align-items-sm-center gap-3" role="alert">
        <span class="flex-grow-1">
          Unable to load articles at this time. Please try again.
        </span>
        ${showRetry
          ? `<button class="btn btn-sm btn-outline-secondary flex-shrink-0"
                     id="gtn-retry-btn">Try again</button>`
          : ""}
      </div>
    </div>
  `;
}

function renderEmpty() {
  return `
    <div class="container py-5 text-center">
      <p class="text-muted fs-5 mb-4">No articles published yet &mdash; check back soon!</p>
      <a href="#/home" class="btn btn-outline-secondary">Back to Home</a>
    </div>
  `;
}

function renderNotFound() {
  return `
    <div class="container py-5 text-center">
      <h2 class="gtn-not-found__title">Article not found</h2>
      <p class="text-muted mb-4">
        The article you&rsquo;re looking for doesn&rsquo;t exist or may have been removed.
      </p>
      <a href="#/good-to-know" class="btn btn-outline-secondary">
        Back to all articles
      </a>
    </div>
  `;
}

// ─── list view ────────────────────────────────────────────
function renderListHero() {
  return `
    <section class="gtn-hero" aria-label="Good to Know section">
      <div class="gtn-hero__overlay" aria-hidden="true"></div>
      <div class="container">
        <div class="gtn-hero__inner">
          <span class="gtn-hero__eyebrow">
            <span class="gtn-hero__eyebrow-line" aria-hidden="true"></span>
            From Our Kitchen &middot; Baking Education
          </span>
          <h1 class="gtn-hero__title">Good to Know</h1>
          <p class="gtn-hero__subtitle">
            Practical guides, tips and baking science from our team &mdash;
            everything you need to understand real sourdough.
          </p>
        </div>
      </div>
    </section>
  `;
}

function renderArticleCard(article) {
  const img = getArticleImage(article);
  const preview = getPreview(article);
  const dateStr = formatDate(article.created_at);
  const href = `#/good-to-know?slug=${encodeURIComponent(article.slug)}`;

  return `
    <div class="col-12 col-md-6 col-xl-4">
      <article class="gtn-card h-100"
               aria-labelledby="gtn-card-title-${esc(article.id)}">
        <a href="${href}" class="gtn-card__img-link" tabindex="-1" aria-hidden="true">
          <img
            class="gtn-card__img"
            src="${esc(img)}"
            alt="${esc(article.title)}"
            loading="lazy"
            onerror="if(this.src!==&quot;${FALLBACK_IMG}&quot;)this.src=&quot;${FALLBACK_IMG}&quot;"
          />
        </a>
        <div class="gtn-card__body">
          ${dateStr
            ? `<time class="gtn-card__date" datetime="${esc(article.created_at)}">${dateStr}</time>`
            : ""}
          <h2 class="gtn-card__title" id="gtn-card-title-${esc(article.id)}">${esc(article.title)}</h2>
          ${preview ? `<p class="gtn-card__preview">${esc(preview)}</p>` : ""}
          <a href="${href}" class="gtn-card__cta"
             aria-label="Read article: ${esc(article.title)}">
            Read article <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </article>
    </div>
  `;
}

function renderListView(articles) {
  if (articles.length === 0) {
    return renderListHero() + renderEmpty();
  }
  return `
    ${renderListHero()}
    <section class="gtn-grid-section section" aria-labelledby="gtn-articles-heading">
      <div class="container">
        <h2 id="gtn-articles-heading" class="visually-hidden">Articles</h2>
        <div class="row g-4">
          ${articles.map(renderArticleCard).join("")}
        </div>
      </div>
    </section>
  `;
}

// ─── detail view ──────────────────────────────────────────
function renderDetailHero(article) {
  const img = esc(getArticleImage(article));
  const dateStr = formatDate(article.created_at);

  return `
    <section class="gtn-detail-hero"
             style="background-image:url('${img}')"
             aria-labelledby="gtn-article-title">
      <div class="gtn-detail-hero__overlay" aria-hidden="true"></div>
      <div class="container">
        <div class="gtn-detail-hero__inner">
          <a href="#/good-to-know" class="gtn-detail-hero__back">
            <span aria-hidden="true">&larr;</span> All articles
          </a>
          <h1 class="gtn-detail-hero__title" id="gtn-article-title">${esc(article.title)}</h1>
          ${article.summary
            ? `<p class="gtn-detail-hero__summary">${esc(article.summary)}</p>`
            : ""}
          ${dateStr
            ? `<time class="gtn-detail-hero__date"
                     datetime="${esc(article.created_at)}">${dateStr}</time>`
            : ""}
        </div>
      </div>
    </section>
  `;
}

function renderDetailBody(article) {
  const dateStr = formatDate(article.created_at);
  const paragraphs = (article.content || "")
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("\n");

  return `
    <section class="gtn-detail-body section" aria-label="Article content">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-12 col-lg-8">
            <div class="gtn-detail-content">
              ${paragraphs || `<p>${esc(article.content)}</p>`}
            </div>
            ${dateStr
              ? `<p class="gtn-detail-meta">
                   Published:
                   <time datetime="${esc(article.created_at)}">${dateStr}</time>
                 </p>`
              : ""}
            <a href="#/good-to-know" class="btn gtn-back-btn mt-4">
              <span aria-hidden="true">&larr;</span> Back to all articles
            </a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderRelatedCard(article) {
  const img = getArticleImage(article);
  const href = `#/good-to-know?slug=${encodeURIComponent(article.slug)}`;

  return `
    <div class="col-12 col-sm-6 col-md-4">
      <article class="gtn-card gtn-card--sm h-100"
               aria-labelledby="gtn-related-title-${esc(article.id)}">
        <a href="${href}" class="gtn-card__img-link" tabindex="-1" aria-hidden="true">
          <img
            class="gtn-card__img"
            src="${esc(img)}"
            alt="${esc(article.title)}"
            loading="lazy"
            onerror="if(this.src!==&quot;${FALLBACK_IMG}&quot;)this.src=&quot;${FALLBACK_IMG}&quot;"
          />
        </a>
        <div class="gtn-card__body">
          <h3 class="gtn-card__title gtn-card__title--sm"
              id="gtn-related-title-${esc(article.id)}">${esc(article.title)}</h3>
          <a href="${href}" class="gtn-card__cta"
             aria-label="Read: ${esc(article.title)}">
            Read <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </article>
    </div>
  `;
}

function renderRelatedSection(allArticles, currentId) {
  const related = allArticles.filter((a) => a.id !== currentId).slice(0, 3);
  if (related.length === 0) return "";

  return `
    <section class="gtn-related section" aria-labelledby="gtn-related-heading">
      <div class="container">
        <h2 id="gtn-related-heading" class="gtn-related__title">Related Articles</h2>
        <div class="row g-4">
          ${related.map(renderRelatedCard).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderDetailView(article, allArticles) {
  return (
    renderDetailHero(article) +
    renderDetailBody(article) +
    renderRelatedSection(allArticles, article.id)
  );
}

// ─── page lifecycle ───────────────────────────────────────
export function render() {
  return template;
}

export async function mount() {
  const container = document.getElementById("page-container");
  if (container) container.classList.remove("py-4", "py-md-5");

  const root = document.getElementById("gtn-root");
  if (!root) return;

  const { slug } = getRouteParams();
  root.innerHTML = renderSpinner();

  try {
    const articles = await getPublishedArticles();

    if (slug) {
      const article = articles.find((a) => a.slug === slug) ?? null;
      if (!article) {
        document.title = "Sourdough Bakery | Article Not Found";
        root.innerHTML = renderNotFound();
        return;
      }
      document.title = `Sourdough Bakery | ${article.title}`;
      root.innerHTML = renderDetailView(article, articles);
    } else {
      document.title = "Sourdough Bakery | Good to Know";
      root.innerHTML = renderListView(articles);
    }
  } catch (err) {
    console.error("[GoodToKnow] Failed to load:", err);
    root.innerHTML = renderErrorAlert(true);
    const retryBtn = document.getElementById("gtn-retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", mount);
    }
  }
}

export function unmount() {
  const container = document.getElementById("page-container");
  if (container) container.classList.add("py-4", "py-md-5");
}

