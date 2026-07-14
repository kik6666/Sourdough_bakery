import { Modal } from "bootstrap";
import template from "./index.html?raw";
import "./styles.css";
import {
  listUsers,
  updateUserProfile,
  deleteUserProfile,
} from "../../services/user-service.js";
import { getAuthState } from "../../auth/auth-state.js";

// ─── module state ──────────────────────────────────────────
let _users = [];
let _searchQuery = "";
let _roleFilter = "";
let _sortOrder = "desc";
let _editingId = null;
let _deleteTargetId = null;
let _editModal = null;
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

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name) {
  return String(name ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function el(id) {
  return document.getElementById(id);
}

// ─── alerts ───────────────────────────────────────────────
function showPageAlert(message, type = "success") {
  const host = el("mu-page-alerts");
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
  const host = el("mu-modal-alerts");
  if (!host) return;
  host.innerHTML = `<div class="alert alert-${type} mb-2" role="alert">${esc(message)}</div>`;
}

// ─── form helpers ──────────────────────────────────────────
function clearFormValidation() {
  document.querySelectorAll("#mu-edit-form .is-invalid").forEach((node) => {
    node.classList.remove("is-invalid");
  });
  document.querySelectorAll(".mu-field-error").forEach((node) => {
    node.textContent = "";
  });
}

function showFieldError(fieldId, message) {
  const field = el(fieldId);
  const errorEl = el(`${fieldId}-error`);
  if (field) field.classList.add("is-invalid");
  if (errorEl) errorEl.textContent = message;
}

function populateForm(user) {
  el("mu-field-name").value = user?.full_name ?? "";
  el("mu-field-role").value = user?.role ?? "customer";
  el("mu-field-phone").value = user?.phone ?? "";
  el("mu-field-address").value = user?.address ?? "";
}

function setSubmitting(loading) {
  _submitting = loading;
  const btn = el("mu-edit-submit-btn");
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> Saving\u2026`
    : "Save changes";
}

// ─── table rendering ──────────────────────────────────────
function getFiltered() {
  let list = _users;

  if (_roleFilter) {
    list = list.filter((u) => u.role === _roleFilter);
  }

  const q = _searchQuery.toLowerCase().trim();
  if (q) {
    list = list.filter((u) => u.full_name.toLowerCase().includes(q));
  }

  return list;
}

function renderRows() {
  const tbody = el("mu-table-body");
  if (!tbody) return;

  const filtered = getFiltered();

  if (filtered.length === 0) {
    const msg = _searchQuery || _roleFilter
      ? "No users match the current filters."
      : "No users found.";
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5">${msg}</td></tr>`;
    return;
  }

  const currentUserId = getAuthState()?.userId ?? null;

  tbody.innerHTML = filtered
    .map((user) => {
      const isSelf = user.id === currentUserId;
      const roleBadgeClass =
        user.role === "administrator" ? "mu-role-badge--admin" : "mu-role-badge--customer";
      const avatarHtml = user.avatar_url
        ? `<img src="${esc(user.avatar_url)}" alt="" class="mu-avatar" loading="lazy" />`
        : `<span class="mu-avatar-placeholder" aria-hidden="true">${esc(initials(user.full_name))}</span>`;

      return `
        <tr>
          <td>
            <div class="mu-user-cell">
              ${avatarHtml}
              <div>
                <div class="fw-semibold lh-sm">
                  ${esc(user.full_name)}
                  ${isSelf ? `<span class="badge bg-secondary ms-1 fw-normal" style="font-size:0.65rem">you</span>` : ""}
                </div>
                <div class="text-muted" style="font-size:0.75rem">${esc(user.id.slice(0, 8))}\u2026</div>
              </div>
            </div>
          </td>
          <td>
            <span class="mu-role-badge ${roleBadgeClass}">${esc(user.role)}</span>
          </td>
          <td class="d-none d-md-table-cell">
            <span class="text-muted small">${esc(user.phone || "\u2014")}</span>
          </td>
          <td class="d-none d-lg-table-cell">
            <span class="text-muted small">${formatDate(user.created_at)}</span>
          </td>
          <td class="text-end">
            <div class="d-flex gap-2 justify-content-end">
              <button
                class="btn btn-sm btn-outline-secondary mu-edit-btn"
                data-id="${esc(user.id)}"
                aria-label="Edit ${esc(user.full_name)}"
              >Edit</button>
              <button
                class="btn btn-sm btn-outline-danger mu-delete-btn"
                data-id="${esc(user.id)}"
                data-name="${esc(user.full_name)}"
                aria-label="Delete ${esc(user.full_name)}"
                ${isSelf ? "disabled title=\"You cannot delete your own account\"" : ""}
              >Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ─── load data ────────────────────────────────────────────
async function loadUsers() {
  const tbody = el("mu-table-body");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5">
          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Loading users\u2026
        </td>
      </tr>
    `;
  }

  try {
    _users = await listUsers({ order: _sortOrder });
    renderRows();
  } catch (err) {
    console.error("[ManageUsers] load error:", err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <div class="alert alert-warning d-inline-flex align-items-center gap-3 mb-0">
              <span>Failed to load users.</span>
              <button class="btn btn-sm btn-outline-secondary" id="mu-retry-btn">Retry</button>
            </div>
          </td>
        </tr>
      `;
      el("mu-retry-btn")?.addEventListener("click", loadUsers);
    }
  }
}

// ─── edit submit ──────────────────────────────────────────
async function handleEditSubmit(e) {
  e.preventDefault();
  if (_submitting || !_editingId) return;

  clearFormValidation();
  el("mu-modal-alerts").innerHTML = "";

  const full_name = el("mu-field-name")?.value ?? "";
  const role = el("mu-field-role")?.value ?? "customer";
  const phone = el("mu-field-phone")?.value ?? "";
  const address = el("mu-field-address")?.value ?? "";

  if (full_name.trim().length < 2) {
    showFieldError("mu-field-name", "Full name must be at least 2 characters.");
    el("mu-field-name")?.focus();
    return;
  }

  setSubmitting(true);

  try {
    const updated = await updateUserProfile(_editingId, { full_name, role, phone, address });
    // Update local state
    const idx = _users.findIndex((u) => u.id === _editingId);
    if (idx !== -1) _users[idx] = { ..._users[idx], ...updated };
    _editModal?.hide();
    showPageAlert("User updated successfully.");
    renderRows();
  } catch (err) {
    console.error("[ManageUsers] update error:", err);
    showModalAlert(err.message);
  } finally {
    setSubmitting(false);
  }
}

// ─── delete ───────────────────────────────────────────────
function openDeleteModal(id, name) {
  _deleteTargetId = id;
  const nameEl = el("mu-delete-user-name");
  if (nameEl) nameEl.textContent = name;
  el("mu-delete-alert").innerHTML = "";
  const confirmBtn = el("mu-delete-confirm-btn");
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Delete profile";
  }
  _deleteModal?.show();
}

async function handleDeleteConfirm() {
  if (!_deleteTargetId) return;

  const btn = el("mu-delete-confirm-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> Deleting\u2026`;

  try {
    await deleteUserProfile(_deleteTargetId);
    _users = _users.filter((u) => u.id !== _deleteTargetId);
    _deleteTargetId = null;
    _deleteModal?.hide();
    showPageAlert("User profile deleted.");
    renderRows();
  } catch (err) {
    console.error("[ManageUsers] delete error:", err);
    const alertEl = el("mu-delete-alert");
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-warning mb-2">${esc(err.message)}</div>`;
    }
    btn.disabled = false;
    btn.textContent = "Delete profile";
  }
}

// ─── event binding ────────────────────────────────────────
function bindEvents() {
  el("mu-search")?.addEventListener("input", (e) => {
    _searchQuery = e.target.value;
    renderRows();
  });

  el("mu-role-filter")?.addEventListener("change", (e) => {
    _roleFilter = e.target.value;
    renderRows();
  });

  el("mu-sort-select")?.addEventListener("change", async (e) => {
    _sortOrder = e.target.value;
    await loadUsers();
  });

  el("mu-edit-form")?.addEventListener("submit", handleEditSubmit);

  el("mu-table-body")?.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".mu-edit-btn");
    if (editBtn) {
      const id = editBtn.dataset.id;
      const user = _users.find((u) => u.id === id);
      if (!user) return;
      _editingId = id;
      populateForm(user);
      clearFormValidation();
      el("mu-modal-alerts").innerHTML = "";
      _editModal?.show();
      return;
    }

    const deleteBtn = e.target.closest(".mu-delete-btn");
    if (deleteBtn && !deleteBtn.disabled) {
      openDeleteModal(deleteBtn.dataset.id, deleteBtn.dataset.name);
    }
  });

  el("mu-delete-confirm-btn")?.addEventListener("click", handleDeleteConfirm);
}

// ─── page lifecycle ───────────────────────────────────────
export function render() {
  return template;
}

export async function mount() {
  document.title = "Sourdough Bakery | Manage Users";

  const editModalEl = el("mu-edit-modal");
  const deleteModalEl = el("mu-delete-modal");
  if (editModalEl) _editModal = new Modal(editModalEl);
  if (deleteModalEl) _deleteModal = new Modal(deleteModalEl);

  bindEvents();
  await loadUsers();
}

export function unmount() {
  try {
    _editModal?.hide();
    _deleteModal?.hide();
    _editModal?.dispose();
    _deleteModal?.dispose();
  } catch {
    // ignore disposal errors on navigation
  }
  _editModal = null;
  _deleteModal = null;
  _users = [];
  _editingId = null;
  _deleteTargetId = null;
  _searchQuery = "";
  _roleFilter = "";
  _submitting = false;
}
