import { Modal } from "bootstrap";
import template from "./index.html?raw";
import "./styles.css";
import {
  listRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../../services/recipe-service.js";
import { uploadRecipeImage } from "../../services/storage-service.js";

// ─── module state ─────────────────────────────────────────
let _recipes = [];
let _searchQuery = "";
let _sortOrder = "desc";
let _editingId = null;
let _deleteTargetId = null;
let _formModal = null;
let _deleteModal = null;
let _submitting = false;

// ─── utilities ───────────────────────────────────────────
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

// ─── alerts ───────────────────────────────────────────
function showPageAlert(message, type = "success") {
  const host = el("mr-page-alerts");
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
  const host = el("mr-modal-alerts");
  if (!host) return;
  host.innerHTML = `<div class="alert alert-${type} mb-2" role="alert">${esc(message)}</div>`;
}

// ─── form helpers ──────────────────────────────────────
function clearFormValidation() {
  document.querySelectorAll("#mr-recipe-form .is-invalid").forEach((node) => {
    node.classList.remove("is-invalid");
  });
  document.querySelectorAll(".mr-field-error").forEach((node) => {
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
    title: el("mr-field-title")?.value ?? "",
    slug: el("mr-field-slug")?.value ?? "",
    description: el("mr-field-description")?.value ?? "",
    content: el("mr-field-content")?.value ?? "",
    image_url: el("mr-field-image-url")?.value ?? "",
  };
}

function populateForm(recipe) {
  el("mr-field-title").value = recipe?.title ?? "";
  el("mr-field-slug").value = recipe?.slug ?? "";
  el("mr-field-description").value = recipe?.description ?? "";
  el("mr-field-content").value = recipe?.content ?? "";
  el("mr-field-image-url").value = recipe?.image_url ?? "";
  if (el("mr-upload-status")) el("mr-upload-status").textContent = "";
}

function setSubmitting(loading) {
  _submitting = loading;
  const btn = el("mr-form-submit-btn");
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> Saving\u2026`
    : "Save recipe";
  const uploadBtn = el("mr-upload-btn");
  if (uploadBtn) uploadBtn.disabled = loading;
}

// ─── table rendering ─────────────────────────────────────
function getFiltered() {
  const q = _searchQuery.toLowerCase().trim();
  if (!q) return _recipes;
  return _recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q)
  );
}

function renderRows() {
  const tbody = el("mr-table-body");
  if (!tbody) return;

  const filtered = getFiltered();

  if (filtered.length === 0) {
    const msg = _searchQuery
      ? `No recipes match &ldquo;<strong>${esc(_searchQuery)}</strong>&rdquo;.`
      : "No recipes yet. Create the first one!";
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-5">${msg}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (recipe) => `
    <tr>
      <td>
        <div class="mr-title-cell">
          ${
            recipe.image_url
              ? `<img src="${esc(recipe.image_url)}" alt="" class="mr-thumb" loading="lazy" />`
              : `<span class="mr-thumb-placeholder" aria-hidden="true"></span>`
          }
          <div>
            <div class="fw-semibold lh-sm">${esc(recipe.title)}</div>
            <code class="mr-slug-badge">${esc(recipe.slug)}</code>
          </div>
        </div>
      </td>
      <td class="d-none d-lg-table-cell">
        <span class="text-muted small">${esc(truncate(recipe.description || recipe.content))}</span>
      </td>
      <td class="d-none d-md-table-cell">
        <span class="text-muted small">${formatDate(recipe.created_at)}</span>
      </td>
      <td class="text-end">
        <div class="d-flex gap-2 justify-content-end">
          <button
            class="btn btn-sm btn-outline-secondary mr-edit-btn"
            data-id="${esc(recipe.id)}"
            aria-label="Edit ${esc(recipe.title)}"
          >Edit</button>
          <button
            class="btn btn-sm btn-outline-danger mr-delete-btn"
            data-id="${esc(recipe.id)}"
            data-title="${esc(recipe.title)}"
            aria-label="Delete ${esc(recipe.title)}"
          >Delete</button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// ─── load data ─────────────────────────────────────────
async function loadRecipes() {
  const tbody = el("mr-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-5">
          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Loading recipes\u2026
        </td>
      </tr>
    `;
  }

  try {
    _recipes = await listRecipes({ order: _sortOrder });
    renderRows();
  } catch (err) {
    console.error("[ManageRecipes] load error:", err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4">
            <div class="alert alert-warning d-inline-flex align-items-center gap-3 mb-0">
              <span>Failed to load recipes.</span>
              <button class="btn btn-sm btn-outline-secondary" id="mr-retry-btn">Retry</button>
            </div>
          </td>
        </tr>
      `;
      el("mr-retry-btn")?.addEventListener("click", loadRecipes);
    }
  }
}

// ─── form submit ───────────────────────────────────────
async function handleFormSubmit(e) {
  e.preventDefault();
  if (_submitting) return;

  clearFormValidation();
  el("mr-modal-alerts").innerHTML = "";

  const values = getFormValues();
  let hasError = false;

  if (!values.title.trim()) {
    showFieldError("mr-field-title", "Title is required.");
    hasError = true;
  }
  if (!values.slug.trim()) {
    showFieldError("mr-field-slug", "Slug is required.");
    hasError = true;
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
    showFieldError("mr-field-slug", "Lowercase letters, numbers and hyphens only.");
    hasError = true;
  }
  if (!values.content.trim()) {
    showFieldError("mr-field-content", "Content is required.");
    hasError = true;
  }

  if (hasError) {
    document.querySelector("#mr-recipe-form .is-invalid")?.focus();
    return;
  }

  setSubmitting(true);

  try {
    if (_editingId) {
      await updateRecipe(_editingId, values);
      showPageAlert("Recipe updated successfully.");
    } else {
      await createRecipe(values);
      showPageAlert("Recipe created successfully.");
    }
    _formModal?.hide();
    await loadRecipes();
  } catch (err) {
    console.error("[ManageRecipes] save error:", err);
    showModalAlert(err.message);
  } finally {
    setSubmitting(false);
  }
}

// ─── delete ────────────────────────────────────────────
function openDeleteModal(id, title) {
  _deleteTargetId = id;
  const titleEl = el("mr-delete-recipe-title");
  if (titleEl) titleEl.textContent = title;
  el("mr-delete-alert").innerHTML = "";
  const confirmBtn = el("mr-delete-confirm-btn");
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Delete";
  }
  _deleteModal?.show();
}

async function handleDeleteConfirm() {
  if (!_deleteTargetId) return;

  const btn = el("mr-delete-confirm-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> Deleting\u2026`;

  try {
    await deleteRecipe(_deleteTargetId);
    _recipes = _recipes.filter((r) => r.id !== _deleteTargetId);
    _deleteTargetId = null;
    _deleteModal?.hide();
    showPageAlert("Recipe deleted.");
    renderRows();
  } catch (err) {
    console.error("[ManageRecipes] delete error:", err);
    const alertEl = el("mr-delete-alert");
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-warning mb-2">${esc(err.message)}</div>`;
    }
    btn.disabled = false;
    btn.textContent = "Delete";
  }
}

// ─── image upload ───────────────────────────────────────
async function handleImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const btn = el("mr-upload-btn");
  const status = el("mr-upload-status");
  if (btn) btn.disabled = true;
  if (status) status.textContent = "Uploading\u2026";

  try {
    const result = await uploadRecipeImage(file);
    if (!result.ok) {
      if (status) status.textContent = result.error.message;
      return;
    }
    const urlField = el("mr-field-image-url");
    if (urlField) urlField.value = result.data.publicUrl ?? "";
    if (status) status.textContent = "Image uploaded successfully.";
  } catch (err) {
    if (status) status.textContent = "Upload failed. Please try again.";
    console.error("[ManageRecipes] upload error:", err);
  } finally {
    if (btn) btn.disabled = false;
    e.target.value = "";
  }
}

// ─── event binding ─────────────────────────────────────
function bindEvents() {
  el("mr-search")?.addEventListener("input", (e) => {
    _searchQuery = e.target.value;
    renderRows();
  });

  el("mr-sort-select")?.addEventListener("change", async (e) => {
    _sortOrder = e.target.value;
    await loadRecipes();
  });

  el("mr-new-btn")?.addEventListener("click", () => {
    _editingId = null;
    populateForm(null);
    clearFormValidation();
    el("mr-modal-alerts").innerHTML = "";
    el("mr-form-modal-title").textContent = "New Recipe";
    _formModal?.show();
  });

  el("mr-field-title")?.addEventListener("input", (e) => {
    if (!_editingId) {
      const slugField = el("mr-field-slug");
      if (slugField) slugField.value = slugify(e.target.value);
    }
  });

  el("mr-recipe-form")?.addEventListener("submit", handleFormSubmit);

  el("mr-table-body")?.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".mr-edit-btn");
    if (editBtn) {
      const id = editBtn.dataset.id;
      const recipe = _recipes.find((r) => r.id === id);
      if (!recipe) return;
      _editingId = id;
      populateForm(recipe);
      clearFormValidation();
      el("mr-modal-alerts").innerHTML = "";
      el("mr-form-modal-title").textContent = "Edit Recipe";
      _formModal?.show();
      return;
    }

    const deleteBtn = e.target.closest(".mr-delete-btn");
    if (deleteBtn) {
      openDeleteModal(deleteBtn.dataset.id, deleteBtn.dataset.title);
    }
  });

  el("mr-delete-confirm-btn")?.addEventListener("click", handleDeleteConfirm);

  el("mr-upload-btn")?.addEventListener("click", () => {
    el("mr-image-file")?.click();
  });

  el("mr-image-file")?.addEventListener("change", handleImageUpload);
}

// ─── page lifecycle ─────────────────────────────────────
export function render() {
  return template;
}

export async function mount() {
  document.title = "Sourdough Bakery | Manage Recipes";

  const formModalEl = el("mr-form-modal");
  const deleteModalEl = el("mr-delete-modal");
  if (formModalEl) _formModal = new Modal(formModalEl);
  if (deleteModalEl) _deleteModal = new Modal(deleteModalEl);

  bindEvents();
  await loadRecipes();
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
  _recipes = [];
  _editingId = null;
  _deleteTargetId = null;
  _searchQuery = "";
  _submitting = false;
}

