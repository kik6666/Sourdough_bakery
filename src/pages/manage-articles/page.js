import { Modal } from "bootstrap";
import template from "./index.html?raw";
import "./styles.css";
import {
  listArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../../services/article-service.js";
import { uploadArticleImage } from "../../services/storage-service.js";

// ─── module state ──────────────────────────────────────────
let _articles = [];
let _searchQuery = "";
let _sortOrder = "desc";
let _editingId = null;
let _deleteTargetId = null;
let _formModal = null;
let _deleteModal = null;
let _submitting = false;

// ─── utilities ────────────────────────────────────────────
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function truncate(str, max = 90) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max).trimEnd() + "\u2026" : str;
}

function el(id) {
  return document.getElementById(id);
}

// ─── alerts ───────────────────────────────────────────────
function showPageAlert(message, type = "success") {
  const host = el("ma-page-alerts");
  if (!host) return;
  host.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show mb-3" role="alert">
      ${esc(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  setTimeout(() => { host.innerHTML = ""; }, 5000);
}

function showModalAlert(message, type = "warning") {
  const host = el("ma-modal-alerts");
  if (!host) return;
  host.innerHTML = `
    <div class="alert alert-${type} mb-2" role="alert">${esc(message)}</div>
  `;
}

// ─── form helpers ──────────────────────────────────────────
function clearFormValidation() {
  document.querySelectorAll("#ma-article-form .is-invalid").forEach((node) => {
    node.classList.remove("is-invalid");
  });
  document.querySelectorAll(".ma-field-error").forEach((node) => {
    node.textContent = "";
  });
}

function showFieldError(fieldId, message) {
  const field = el(fieldId);
  const errorEl = el(`${fieldId}-error`);
  if (field) field.classList.add("is-invalid");
  if (errorEl) errorEl.textContent = message;
}

function getFormValues() {
  return {
    title: el("ma-field-title")?.value ?? "",
    slug: el("ma-field-slug")?.value ?? "",
    summary: el("ma-field-summary")?.value ?? "",
    content: el("ma-field-content")?.value ?? "",
    image_url: el("ma-field-image-url")?.value ?? "",
  };
}

function populateForm(article) {
  el("ma-field-title").value = article?.title ?? "";
  el("ma-field-slug").value = article?.slug ?? "";
  el("ma-field-summary").value = article?.summary ?? "";
  el("ma-field-content").value = article?.content ?? "";
  el("ma-field-image-url").value = article?.image_url ?? "";
  if (el("ma-upload-status")) el("ma-upload-status").textContent = "";
}

function setSubmitting(loading) {
  _submitting = loading;
  const btn = el("ma-form-submit-btn");
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> Saving\u2026`
    : "Save article";
  const uploadBtn = el("ma-upload-btn");
  if (uploadBtn) uploadBtn.disabled = loading;
}

// ─── table rendering ──────────────────────────────────────
function getFiltered() {
  const q = _searchQuery.toLowerCase().trim();
  if (!q) return _articles;
  return _articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q)
  );
}

function renderRows() {
  const tbody = el("ma-table-body");
  if (!tbody) return;

  const filtered = getFiltered();

  if (filtered.length === 0) {
    const msg = _searchQuery
      ? `No articles match &ldquo;<strong>${esc(_searchQuery)}</strong>&rdquo;.`
      : "No articles yet. Create the first one!";
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-5">${msg}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (article) => `
    <tr>
      <td class="ma-col-title">
        <div class="ma-title-cell">
          ${
            article.image_url
              ? `<img src="${esc(article.image_url)}" alt="" class="ma-thumb" loading="lazy" />`
              : `<span class="ma-thumb-placeholder" aria-hidden="true"></span>`
          }
          <div>
            <div class="fw-semibold lh-sm">${esc(article.title)}</div>
            <code class="ma-slug-badge">${esc(article.slug)}</code>
          </div>
        </div>
      </td>
      <td class="d-none d-lg-table-cell">
        <span class="text-muted small">${esc(truncate(article.summary || article.content))}</span>
      </td>
      <td class="d-none d-md-table-cell">
        <span class="text-muted small">${formatDate(article.created_at)}</span>
      </td>
      <td class="text-end">
        <div class="d-flex gap-2 justify-content-end">
          <button
            class="btn btn-sm btn-outline-secondary ma-edit-btn"
            data-id="${esc(article.id)}"
            aria-label="Edit ${esc(article.title)}"
          >Edit</button>
          <button
            class="btn btn-sm btn-outline-danger ma-delete-btn"
            data-id="${esc(article.id)}"
            data-title="${esc(article.title)}"
            aria-label="Delete ${esc(article.title)}"
          >Delete</button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// ─── load data ────────────────────────────────────────────
async function loadArticles() {
  const tbody = el("ma-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-5">
          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Loading articles\u2026
        </td>
      </tr>
    `;
  }

  try {
    _articles = await listArticles({ order: _sortOrder });
    renderRows();
  } catch (err) {
    console.error("[ManageArticles] load error:", err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4">
            <div class="alert alert-warning d-inline-flex align-items-center gap-3 mb-0">
              <span>Failed to load articles.</span>
              <button class="btn btn-sm btn-outline-secondary" id="ma-retry-btn">Retry</button>
            </div>
          </td>
        </tr>
      `;
      el("ma-retry-btn")?.addEventListener("click", loadArticles);
    }
  }
}

// ─── form submit ──────────────────────────────────────────
async function handleFormSubmit(e) {
  e.preventDefault();
  if (_submitting) return;

  clearFormValidation();
  el("ma-modal-alerts").innerHTML = "";

  const values = getFormValues();
  let hasError = false;

  if (!values.title.trim()) {
    showFieldError("ma-field-title", "Title is required.");
    hasError = true;
  }
  if (!values.slug.trim()) {
    showFieldError("ma-field-slug", "Slug is required.");
    hasError = true;
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
    showFieldError("ma-field-slug", "Lowercase letters, numbers and hyphens only.");
    hasError = true;
  }
  if (!values.content.trim()) {
    showFieldError("ma-field-content", "Content is required.");
    hasError = true;
  }

  if (hasError) {
    document.querySelector("#ma-article-form .is-invalid")?.focus();
    return;
  }

  setSubmitting(true);

  try {
    if (_editingId) {
      await updateArticle(_editingId, values);
      showPageAlert("Article updated successfully.");
    } else {
      await createArticle(values);
      showPageAlert("Article created successfully.");
    }
    _formModal?.hide();
    await loadArticles();
  } catch (err) {
    console.error("[ManageArticles] save error:", err);
    showModalAlert(err.message);
  } finally {
    setSubmitting(false);
  }
}

// ─── delete ───────────────────────────────────────────────
function openDeleteModal(id, title) {
  _deleteTargetId = id;
  const titleEl = el("ma-delete-article-title");
  if (titleEl) titleEl.textContent = title;
  el("ma-delete-alert").innerHTML = "";
  const confirmBtn = el("ma-delete-confirm-btn");
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Delete";
  }
  _deleteModal?.show();
}

async function handleDeleteConfirm() {
  if (!_deleteTargetId) return;

  const btn = el("ma-delete-confirm-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> Deleting\u2026`;

  try {
    await deleteArticle(_deleteTargetId);
    // Optimistic remove from local state
    _articles = _articles.filter((a) => a.id !== _deleteTargetId);
    _deleteTargetId = null;
    _deleteModal?.hide();
    showPageAlert("Article deleted.");
    renderRows();
  } catch (err) {
    console.error("[ManageArticles] delete error:", err);
    const alertEl = el("ma-delete-alert");
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-warning mb-2">${esc(err.message)}</div>`;
    }
    btn.disabled = false;
    btn.textContent = "Delete";
  }
}

// ─── image upload ──────────────────────────────────────────
async function handleImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const btn = el("ma-upload-btn");
  const status = el("ma-upload-status");
  if (btn) btn.disabled = true;
  if (status) status.textContent = "Uploading\u2026";

  try {
    const result = await uploadArticleImage(file);
    if (!result.ok) {
      if (status) status.textContent = result.error.message;
      return;
    }
    const urlField = el("ma-field-image-url");
    if (urlField) urlField.value = result.data.publicUrl ?? "";
    if (status) status.textContent = "Image uploaded successfully.";
  } catch (err) {
    if (status) status.textContent = "Upload failed. Please try again.";
    console.error("[ManageArticles] upload error:", err);
  } finally {
    if (btn) btn.disabled = false;
    e.target.value = "";
  }
}

// ─── event binding ────────────────────────────────────────
function bindEvents() {
  // Search
  el("ma-search")?.addEventListener("input", (e) => {
    _searchQuery = e.target.value;
    renderRows();
  });

  // Sort
  el("ma-sort-select")?.addEventListener("change", async (e) => {
    _sortOrder = e.target.value;
    await loadArticles();
  });

  // New article
  el("ma-new-btn")?.addEventListener("click", () => {
    _editingId = null;
    populateForm(null);
    clearFormValidation();
    el("ma-modal-alerts").innerHTML = "";
    el("ma-form-modal-title").textContent = "New Article";
    _formModal?.show();
  });

  // Title → auto-slug on create
  el("ma-field-title")?.addEventListener("input", (e) => {
    if (!_editingId) {
      const slugField = el("ma-field-slug");
      if (slugField) slugField.value = slugify(e.target.value);
    }
  });

  // Form submit
  el("ma-article-form")?.addEventListener("submit", handleFormSubmit);

  // Table: edit + delete via delegation
  el("ma-table-body")?.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".ma-edit-btn");
    if (editBtn) {
      const id = editBtn.dataset.id;
      const article = _articles.find((a) => a.id === id);
      if (!article) return;
      _editingId = id;
      populateForm(article);
      clearFormValidation();
      el("ma-modal-alerts").innerHTML = "";
      el("ma-form-modal-title").textContent = "Edit Article";
      _formModal?.show();
      return;
    }

    const deleteBtn = e.target.closest(".ma-delete-btn");
    if (deleteBtn) {
      openDeleteModal(deleteBtn.dataset.id, deleteBtn.dataset.title);
    }
  });

  // Delete confirm
  el("ma-delete-confirm-btn")?.addEventListener("click", handleDeleteConfirm);

  // Upload: trigger hidden file input
  el("ma-upload-btn")?.addEventListener("click", () => {
    el("ma-image-file")?.click();
  });

  // File selected
  el("ma-image-file")?.addEventListener("change", handleImageUpload);
}

// ─── page lifecycle ───────────────────────────────────────
export function render() {
  return template;
}

export async function mount() {
  document.title = "Sourdough Bakery | Manage Articles";

  // Init Bootstrap modals
  const formModalEl = el("ma-form-modal");
  const deleteModalEl = el("ma-delete-modal");
  if (formModalEl) _formModal = new Modal(formModalEl);
  if (deleteModalEl) _deleteModal = new Modal(deleteModalEl);

  bindEvents();
  await loadArticles();
}

export function unmount() {
  try {
    _formModal?.hide();
    _deleteModal?.hide();
    _formModal?.dispose();
    _deleteModal?.dispose();
  } catch {
    // ignore disposal errors on navigation
  }
  _formModal = null;
  _deleteModal = null;
  _articles = [];
  _editingId = null;
  _deleteTargetId = null;
  _searchQuery = "";
  _submitting = false;
}

