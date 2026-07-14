import template from "./index.html?raw";
import "./styles.css";
import { getMyOrders, cancelOrder } from "../../services/order-service.js";

// ─── state ────────────────────────────────────────────────
let _orders = [];

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
    day: "numeric", month: "long", year: "numeric",
  });
}

function shortId(id) {
  return (id ?? "").slice(0, 8).toUpperCase();
}

// ─── rendering ────────────────────────────────────────────
function renderSpinner() {
  return `
    <div class="d-flex justify-content-center align-items-center py-5"
         role="status" aria-label="Loading orders">
      <span class="spinner-border text-secondary me-3" aria-hidden="true"></span>
      <span class="text-muted">Loading your orders&hellip;</span>
    </div>`;
}

function renderError(message) {
  return `
    <div class="alert alert-warning d-flex align-items-center gap-3" role="alert">
      <span class="flex-grow-1">${esc(message)}</span>
      <button class="btn btn-sm btn-outline-secondary" id="myo-retry-btn">Try again</button>
    </div>`;
}

function renderEmpty() {
  return `
    <div class="myo-empty">
      <div class="myo-empty__icon" aria-hidden="true">🛒</div>
      <h2 class="myo-empty__title">No orders yet</h2>
      <p class="text-muted mb-4">Browse our freshly baked goods and place your first order.</p>
      <a href="#/products" class="btn btn-primary">Shop Our Breads</a>
    </div>`;
}

function renderItemRows(items) {
  if (!items?.length) return `<p class="text-muted small mb-0">No item details available.</p>`;
  return items.map((item) => `
    <div class="myo-item-row">
      <div>
        <span class="myo-item-name">${esc(item.product?.name ?? "Product")}</span>
        <span class="myo-item-qty ms-2">&times;&nbsp;${item.quantity}</span>
      </div>
      <span class="myo-item-price">&euro;${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
    </div>`).join("");
}

function canCancel(status) {
  return !["cancelled", "delivered"].includes(status);
}

function renderOrderCard(order) {
  const collapseId = `myo-items-${shortId(order.id)}`;
  const cancelBtn = canCancel(order.status)
    ? `<button class="btn btn-sm btn-outline-danger myo-cancel-btn"
               data-order-id="${esc(order.id)}"
               aria-label="Cancel order #${shortId(order.id)}">
         Cancel order
       </button>`
    : "";

  const receiptBtn = order.status === "delivered"
    ? `<button class="btn btn-sm btn-outline-secondary myo-receipt-btn"
               data-order-id="${esc(order.id)}"
               aria-label="Download receipt for order #${shortId(order.id)}">
         Receipt
       </button>`
    : "";

  const deliveryLabel = order.deliveryMethod === "delivery" ? "Home delivery" : "Pickup";

  return `
    <article class="myo-card" aria-labelledby="myo-order-${shortId(order.id)}">
      <header class="myo-card__header">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <span class="myo-card__id" id="myo-order-${shortId(order.id)}">
            Order #${shortId(order.id)}
          </span>
          <span class="myo-badge myo-badge--${esc(order.status)}">${esc(order.status)}</span>
          <span class="myo-delivery-chip">${esc(deliveryLabel)}</span>
        </div>
        <time class="myo-card__date" datetime="${esc(order.createdAt)}">
          ${formatDate(order.createdAt)}
        </time>
      </header>

      <div class="myo-card__body">
        ${order.notes
          ? `<p class="small text-muted mb-3">
               <strong>Note:</strong> ${esc(order.notes)}
             </p>`
          : ""}
        <button
          class="myo-items-toggle mb-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#${collapseId}"
          aria-expanded="false"
          aria-controls="${collapseId}"
        >
          View items (${order.items?.length ?? 0})
        </button>
        <div class="collapse" id="${collapseId}">
          <div class="pt-1">
            ${renderItemRows(order.items)}
          </div>
        </div>
      </div>

      <footer class="myo-card__footer">
        <span class="myo-card__total">Total: &euro;${Number(order.totalPrice).toFixed(2)}</span>
        <div class="d-flex gap-2 flex-wrap">
          ${receiptBtn}
          ${cancelBtn}
        </div>
      </footer>
    </article>`;
}

function renderPageAlert(root, message, type) {
  const existing = root.querySelector(".myo-alert");
  if (existing) existing.remove();
  const div = document.createElement("div");
  div.className = `myo-alert alert alert-${type} alert-dismissible fade show mb-4`;
  div.setAttribute("role", "alert");
  div.innerHTML = `${esc(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
  root.insertAdjacentElement("afterbegin", div);
  setTimeout(() => div.remove(), 5000);
}

function renderOrders(root) {
  if (!_orders.length) {
    root.innerHTML = renderEmpty();
    return;
  }

  root.innerHTML = `
    <div class="d-flex align-items-baseline justify-content-between mb-4 flex-wrap gap-2">
      <h1 class="myo-page-title h3 mb-0">My Orders</h1>
      <span class="text-muted small">${_orders.length} order${_orders.length !== 1 ? "s" : ""}</span>
    </div>
    <div class="d-flex flex-column gap-3">
      ${_orders.map(renderOrderCard).join("")}
    </div>`;
}

// ─── cancel handler ───────────────────────────────────────
async function handleCancel(orderId, btn) {
  const root = document.getElementById("myo-root");
  btn.disabled = true;
  btn.textContent = "Cancelling…";

  const result = await cancelOrder(orderId);

  if (!result.ok) {
    btn.disabled = false;
    btn.textContent = "Cancel order";
    if (root) renderPageAlert(root, result.error?.message ?? "Could not cancel order.", "warning");
    return;
  }

  // Update local state and re-render
  const order = _orders.find((o) => o.id === orderId);
  if (order) order.status = "cancelled";
  if (root) {
    renderOrders(root);
    renderPageAlert(root, "Your order has been cancelled.", "success");
  }
}

// ─── lifecycle ────────────────────────────────────────────
export function render() {
  return template;
}

export async function mount() {
  document.title = "Sourdough Bakery | My Orders";

  const root = document.getElementById("myo-root");
  if (!root) return;

  root.innerHTML = renderSpinner();

  const result = await getMyOrders();

  if (!result.ok) {
    root.innerHTML = renderError(result.error?.message ?? "Could not load your orders.");
    root.querySelector("#myo-retry-btn")?.addEventListener("click", mount);
    return;
  }

  _orders = result.data ?? [];
  renderOrders(root);

  // Event delegation for cancel + receipt buttons
  root.addEventListener("click", async (e) => {
    const cancelBtn = e.target.closest(".myo-cancel-btn");
    if (cancelBtn && !cancelBtn.disabled) {
      await handleCancel(cancelBtn.dataset.orderId, cancelBtn);
      return;
    }

    const receiptBtn = e.target.closest(".myo-receipt-btn");
    if (receiptBtn) {
      renderPageAlert(root,
        `Receipt for order #${shortId(receiptBtn.dataset.orderId)} — download available when storage is connected.`,
        "info");
    }
  });
}

export function unmount() {
  _orders = [];
}

