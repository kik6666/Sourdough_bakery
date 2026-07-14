import { Modal } from "bootstrap";
import template from "./index.html?raw";
import "./styles.css";
import { listAllOrders, updateOrderStatus } from "../../services/order-service.js";

// ─── state ───────────────────────────────────────────────
let _orders = [];
let _searchQuery = "";
let _statusFilter = "";
let _deliveryFilter = "";
let _sortOrder = "desc";
let _detailModal = null;
let _selectedReceiptOrderId = null;

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
    day: "2-digit", month: "short", year: "numeric",
  });
}

function shortId(id) {
  return id ? id.slice(0, 8).toUpperCase() : "???";
}

function el(id) { return document.getElementById(id); }

const STATUS_OPTIONS = ["pending","confirmed","preparing","shipped","delivered","cancelled"];

// ─── stats ────────────────────────────────────────────────
function updateStats(orders) {
  const pending = orders.filter((o) => o.status === "pending").length;
  const inProgress = orders.filter((o) => ["confirmed","preparing","shipped"].includes(o.status)).length;

  const pEl = el("mo-stat-pending");
  const iEl = el("mo-stat-inprogress");
  const tEl = el("mo-stat-total");

  if (pEl) pEl.textContent = pending;
  if (iEl) iEl.textContent = inProgress;
  if (tEl) tEl.textContent = orders.length;
}

// ─── filtering ───────────────────────────────────────────
function getFiltered() {
  const q = _searchQuery.toLowerCase().trim();
  return _orders.filter((o) => {
    if (_statusFilter && o.status !== _statusFilter) return false;
    if (_deliveryFilter && o.delivery_method !== _deliveryFilter) return false;
    if (q) {
      const name = (o.profile?.full_name ?? "").toLowerCase();
      const id = (o.id ?? "").toLowerCase();
      if (!name.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });
}

// ─── table rendering ─────────────────────────────────────
function renderRows() {
  const tbody = el("mo-table-body");
  if (!tbody) return;

  const filtered = getFiltered();

  if (filtered.length === 0) {
    const msg = _searchQuery || _statusFilter || _deliveryFilter
      ? "No orders match the current filters."
      : "No orders yet.";
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">${msg}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((order) => {
    const customerName = esc(order.profile?.full_name ?? "Unknown");
    const statusOpts = STATUS_OPTIONS.map((s) =>
      `<option value="${s}" ${order.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
    ).join("");

    return `
      <tr>
        <td><span class="mo-order-id">#${shortId(order.id)}</span></td>
        <td>${customerName}</td>
        <td class="text-end">&euro;${Number(order.total_price).toFixed(2)}</td>
        <td>
          <select class="form-select mo-status-select mo-status-change"
                  data-order-id="${esc(order.id)}"
                  aria-label="Change status for order ${shortId(order.id)}">
            ${statusOpts}
          </select>
        </td>
        <td class="d-none d-md-table-cell text-capitalize">${esc(order.delivery_method)}</td>
        <td class="d-none d-lg-table-cell">${formatDate(order.created_at)}</td>
        <td class="text-end">
          <div class="d-flex gap-2 justify-content-end">
            <button type="button" class="btn btn-sm btn-outline-secondary mo-details-btn"
                    data-order-id="${esc(order.id)}"
                    aria-label="Details for order ${shortId(order.id)}">Details</button>
            <button type="button" class="btn btn-sm btn-outline-primary mo-upload-btn"
                    data-order-id="${esc(order.id)}"
                    aria-label="Upload receipt for order ${shortId(order.id)}">Receipt</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// ─── load ─────────────────────────────────────────────────
async function loadOrders() {
  const tbody = el("mo-table-body");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5">
      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Loading orders\u2026
    </td></tr>`;
  }

  const result = await listAllOrders({ order: _sortOrder });

  if (!result.ok) {
    console.error("[ManageOrders]", result.error);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">
        <div class="alert alert-warning d-inline-flex align-items-center gap-3 mb-0">
          <span>${esc(result.error?.message ?? "Failed to load orders.")}</span>
          <button class="btn btn-sm btn-outline-secondary" id="mo-retry-btn">Retry</button>
        </div>
      </td></tr>`;
      el("mo-retry-btn")?.addEventListener("click", loadOrders);
    }
    return;
  }

  _orders = result.data;
  updateStats(_orders);
  renderRows();
}

// ─── status change ────────────────────────────────────────
async function handleStatusChange(orderId, newStatus, selectEl) {
  const previous = _orders.find((o) => o.id === orderId)?.status;
  selectEl.disabled = true;

  const result = await updateOrderStatus(orderId, newStatus);
  selectEl.disabled = false;

  if (!result.ok) {
    // Revert dropdown
    selectEl.value = previous;
    const host = el("mo-page-alerts");
    if (host) {
      host.innerHTML = `<div class="alert alert-warning alert-dismissible fade show mb-3" role="alert">
        ${esc(result.error?.message ?? "Could not update status.")}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
      setTimeout(() => { host.innerHTML = ""; }, 4000);
    }
    return;
  }

  // Update local state
  const order = _orders.find((o) => o.id === orderId);
  if (order) order.status = newStatus;
  updateStats(_orders);
}

// ─── detail modal ─────────────────────────────────────────
function openDetailModal(orderId) {
  const order = _orders.find((o) => o.id === orderId);
  if (!order || !_detailModal) return;

  const el2 = el("mo-detail-modal-title");
  if (el2) el2.textContent = `Order #${shortId(order.id)}`;

  const body = el("mo-detail-body");
  if (!body) return;

  const items = (order.items ?? []);
  const itemsHtml = items.length
    ? items.map((item) => `
        <div class="mo-detail-item">
          <span>${esc(item.product?.name ?? "Product")} &times; ${item.quantity}</span>
          <span>&euro;${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
        </div>`).join("")
    : `<p class="text-muted small mb-0">No items loaded.</p>`;

  body.innerHTML = `
    <dl class="row mb-3">
      <dt class="col-5 text-muted">Customer</dt>
      <dd class="col-7">${esc(order.profile?.full_name ?? "—")}</dd>
      <dt class="col-5 text-muted">Status</dt>
      <dd class="col-7 text-capitalize">${esc(order.status)}</dd>
      <dt class="col-5 text-muted">Delivery</dt>
      <dd class="col-7 text-capitalize">${esc(order.delivery_method)}</dd>
      <dt class="col-5 text-muted">Date</dt>
      <dd class="col-7">${formatDate(order.created_at)}</dd>
      ${order.notes ? `<dt class="col-5 text-muted">Notes</dt><dd class="col-7">${esc(order.notes)}</dd>` : ""}
    </dl>
    <h3 class="h6 mb-2">Items</h3>
    <div>${itemsHtml}</div>
    <div class="d-flex justify-content-between mt-3 pt-2 border-top fw-semibold">
      <span>Total</span>
      <span>&euro;${Number(order.total_price).toFixed(2)}</span>
    </div>
  `;

  _detailModal.show();
}

// ─── receipt upload ───────────────────────────────────────
function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (!file || !_selectedReceiptOrderId) return;

  const host = el("mo-upload-feedback");
  if (host) {
    host.innerHTML = `<div class="alert alert-success alert-dismissible fade show mb-3" role="alert">
      Receipt <strong>${esc(file.name)}</strong> selected for order <strong>#${shortId(_selectedReceiptOrderId)}</strong>.
      Storage wiring can be connected when ready.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    setTimeout(() => { host.innerHTML = ""; }, 6000);
  }

  e.target.value = "";
  _selectedReceiptOrderId = null;
}

// ─── event binding ────────────────────────────────────────
function bindEvents() {
  el("mo-search")?.addEventListener("input", (e) => {
    _searchQuery = e.target.value;
    renderRows();
  });

  el("mo-status-filter")?.addEventListener("change", (e) => {
    _statusFilter = e.target.value;
    renderRows();
  });

  el("mo-delivery-filter")?.addEventListener("change", (e) => {
    _deliveryFilter = e.target.value;
    renderRows();
  });

  el("mo-sort-select")?.addEventListener("change", async (e) => {
    _sortOrder = e.target.value;
    await loadOrders();
  });

  el("mo-reset-btn")?.addEventListener("click", () => {
    _searchQuery = "";
    _statusFilter = "";
    _deliveryFilter = "";
    const s = el("mo-search"); if (s) s.value = "";
    const sf = el("mo-status-filter"); if (sf) sf.value = "";
    const df = el("mo-delivery-filter"); if (df) df.value = "";
    renderRows();
  });

  el("mo-table-body")?.addEventListener("change", (e) => {
    const sel = e.target.closest(".mo-status-change");
    if (sel) handleStatusChange(sel.dataset.orderId, sel.value, sel);
  });

  el("mo-table-body")?.addEventListener("click", (e) => {
    const detailBtn = e.target.closest(".mo-details-btn");
    if (detailBtn) { openDetailModal(detailBtn.dataset.orderId); return; }

    const uploadBtn = e.target.closest(".mo-upload-btn");
    if (uploadBtn) {
      _selectedReceiptOrderId = uploadBtn.dataset.orderId;
      el("mo-receipt-input")?.click();
    }
  });

  el("mo-receipt-input")?.addEventListener("change", handleFileChange);
}

// ─── lifecycle ────────────────────────────────────────────
export function render() { return template; }

export async function mount() {
  document.title = "Sourdough Bakery | Manage Orders";

  const detailModalEl = el("mo-detail-modal");
  if (detailModalEl) _detailModal = new Modal(detailModalEl);

  bindEvents();
  await loadOrders();
}

export function unmount() {
  try { _detailModal?.hide(); _detailModal?.dispose(); } catch { /* ignore */ }
  _detailModal = null;
  _orders = [];
  _searchQuery = _statusFilter = _deliveryFilter = "";
  _sortOrder = "desc";
  _selectedReceiptOrderId = null;
}
