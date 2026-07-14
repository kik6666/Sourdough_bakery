import { getProfileById, getSession } from "./auth-service.js";
import { supabase } from "./supabase-client.js";

const ORDER_STATUSES = new Set([
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
]);

const PRODUCT_COLUMNS = "id, name, slug, price, image_url, in_stock, is_active";
const ORDER_SELECT_COLUMNS = `
  id,
  user_id,
  total_price,
  status,
  delivery_method,
  notes,
  created_at,
  updated_at,
  items:order_items(
    id,
    order_id,
    product_id,
    quantity,
    unit_price,
    product:products(${PRODUCT_COLUMNS})
  )
`;

function toError(code, message, details = null) {
  return { code, message, details };
}

function ok(data) {
  return { ok: true, data, error: null };
}

function fail(code, message, details = null) {
  return { ok: false, data: null, error: toError(code, message, details) };
}

function normalizeQuantity(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeOrder(order) {
  const items = (order?.items || []).map((item) => ({
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    lineTotal: Number(item.quantity) * Number(item.unit_price),
    product: item.product,
  }));

  return {
    id: order.id,
    userId: order.user_id,
    totalPrice: Number(order.total_price),
    status: order.status,
    deliveryMethod: order.delivery_method,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items,
  };
}

async function getAuthenticatedUser() {
  const session = await getSession();
  return session?.user || null;
}

async function ensureAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return fail("AUTH_REQUIRED", "You must be authenticated to perform this action.");
  }

  return ok(user);
}

async function isCurrentUserAdmin(userId) {
  const profile = await getProfileById(userId);
  return profile?.role === "administrator";
}

function extractCartItems(cart) {
  if (!cart || typeof cart !== "object") {
    return fail("INVALID_CART", "Cart payload is required.");
  }

  const items = Array.isArray(cart.items) ? cart.items : [];
  if (!items.length) {
    return fail("EMPTY_ORDER", "Cannot create an order from an empty cart.");
  }

  const normalizedItems = [];

  for (const item of items) {
    const productId = item?.productId || item?.product_id || item?.product?.id || null;
    const quantity = normalizeQuantity(item?.quantity);

    if (!productId || !quantity) {
      return fail("INVALID_CART_ITEM", "Each cart item must include productId and positive quantity.", {
        item,
      });
    }

    normalizedItems.push({ productId, quantity });
  }

  return ok(normalizedItems);
}

async function loadProductsForOrder(productIds) {
  const uniqueIds = [...new Set(productIds)];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  const products = data || [];
  const byId = new Map(products.map((product) => [product.id, product]));
  return byId;
}

function validateOrderProducts(items, productsById) {
  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) {
      return fail("PRODUCT_NOT_FOUND", "One or more products do not exist.", {
        productId: item.productId,
      });
    }

    if (!product.is_active || !product.in_stock) {
      return fail("PRODUCT_UNAVAILABLE", "One or more products are unavailable.", {
        productId: item.productId,
      });
    }
  }

  return ok(true);
}

function buildOrderItemsForInsert(orderId, items, productsById) {
  return items.map((item) => {
    const product = productsById.get(item.productId);
    return {
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: Number(product.price),
    };
  });
}

function computeTotal(items, productsById) {
  return items.reduce((sum, item) => {
    const product = productsById.get(item.productId);
    return sum + Number(product.price) * item.quantity;
  }, 0);
}

async function getOrderByIdInternal(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT_COLUMNS)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createOrder(cart) {
  try {
    const authResult = await ensureAuthenticatedUser();
    if (!authResult.ok) {
      return authResult;
    }

    const user = authResult.data;

    const itemsResult = extractCartItems(cart);
    if (!itemsResult.ok) {
      return itemsResult;
    }

    const normalizedItems = itemsResult.data;
    const productsById = await loadProductsForOrder(normalizedItems.map((item) => item.productId));

    const stockValidation = validateOrderProducts(normalizedItems, productsById);
    if (!stockValidation.ok) {
      return stockValidation;
    }

    const totalPrice = computeTotal(normalizedItems, productsById);
    if (totalPrice <= 0) {
      return fail("INVALID_TOTAL", "Calculated order total must be greater than zero.");
    }

    const { data: order, error: orderInsertError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "confirmed",
        total_price: totalPrice,
        delivery_method: cart?.deliveryMethod === "delivery" ? "delivery" : "pickup",
        notes: cart?.notes ? String(cart.notes).trim() : null,
      })
      .select("id")
      .single();

    if (orderInsertError) {
      throw orderInsertError;
    }

    const orderItems = buildOrderItemsForInsert(order.id, normalizedItems, productsById);
    const { error: itemsInsertError } = await supabase.from("order_items").insert(orderItems);
    if (itemsInsertError) {
      throw itemsInsertError;
    }

    const createdOrder = await getOrderByIdInternal(order.id);
    if (!createdOrder) {
      return fail("ORDER_CREATE_INCOMPLETE", "Order was created but could not be loaded.", {
        orderId: order.id,
      });
    }

    return ok(normalizeOrder(createdOrder));
  } catch (error) {
    return fail("ORDER_CREATE_FAILED", "Could not create order.", error.message);
  }
}

export async function getMyOrders() {
  try {
    const authResult = await ensureAuthenticatedUser();
    if (!authResult.ok) {
      return authResult;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT_COLUMNS)
      .neq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const orders = (data || []).map(normalizeOrder);
    return ok(orders);
  } catch (error) {
    return fail("ORDERS_FETCH_FAILED", "Could not fetch your orders.", error.message);
  }
}

export async function getOrderById(orderId) {
  try {
    const authResult = await ensureAuthenticatedUser();
    if (!authResult.ok) {
      return authResult;
    }

    if (!orderId) {
      return fail("INVALID_ORDER_ID", "Order ID is required.");
    }

    const order = await getOrderByIdInternal(orderId);
    if (!order) {
      return fail("ORDER_NOT_FOUND", "Order not found.", { orderId });
    }

    return ok(normalizeOrder(order));
  } catch (error) {
    return fail("ORDER_FETCH_FAILED", "Could not fetch order details.", error.message);
  }
}

export async function cancelOrder(orderId) {
  try {
    const authResult = await ensureAuthenticatedUser();
    if (!authResult.ok) {
      return authResult;
    }

    if (!orderId) {
      return fail("INVALID_ORDER_ID", "Order ID is required.");
    }

    const currentOrder = await getOrderByIdInternal(orderId);
    if (!currentOrder) {
      return fail("ORDER_NOT_FOUND", "Order not found.", { orderId });
    }

    if (currentOrder.status === "cancelled") {
      return fail("ALREADY_CANCELLED", "Order is already cancelled.", { orderId });
    }

    if (currentOrder.status === "delivered") {
      return fail("CANCEL_NOT_ALLOWED", "Delivered orders cannot be cancelled.", { orderId });
    }

    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    if (error) {
      if (error.code === "42501") {
        return fail(
          "FORBIDDEN",
          "You are not allowed to cancel this order under current permissions.",
          error.message
        );
      }
      throw error;
    }

    const updated = await getOrderByIdInternal(orderId);
    if (!updated) {
      return fail("ORDER_FETCH_FAILED", "Order cancelled but could not be loaded.", { orderId });
    }

    return ok(normalizeOrder(updated));
  } catch (error) {
    return fail("ORDER_CANCEL_FAILED", "Could not cancel order.", error.message);
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    const authResult = await ensureAuthenticatedUser();
    if (!authResult.ok) {
      return authResult;
    }

    const user = authResult.data;
    const isAdmin = await isCurrentUserAdmin(user.id);
    if (!isAdmin) {
      return fail("ADMIN_REQUIRED", "Only administrators can update order status.");
    }

    if (!orderId) {
      return fail("INVALID_ORDER_ID", "Order ID is required.");
    }

    const nextStatus = String(status || "").trim().toLowerCase();
    if (!ORDER_STATUSES.has(nextStatus)) {
      return fail("INVALID_STATUS", "Invalid order status.", {
        status,
        allowed: [...ORDER_STATUSES],
      });
    }

    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
    if (error) {
      throw error;
    }

    const updated = await getOrderByIdInternal(orderId);
    if (!updated) {
      return fail("ORDER_NOT_FOUND", "Order not found.", { orderId });
    }

    return ok(normalizeOrder(updated));
  } catch (error) {
    return fail("ORDER_STATUS_UPDATE_FAILED", "Could not update order status.", error.message);
  }
}

/**
 * Admin-only: list all orders with customer name and line items.
 * @param {{ status?: string, order?: 'asc'|'desc' }} options
 * @returns {Promise<{ok, data, error}>}
 */
export async function listAllOrders({ status = "", order = "desc" } = {}) {
  try {
    const authResult = await ensureAuthenticatedUser();
    if (!authResult.ok) return authResult;

    const user = authResult.data;
    const isAdmin = await isCurrentUserAdmin(user.id);
    if (!isAdmin) return fail("ADMIN_REQUIRED", "Only administrators can view all orders.");

    let query = supabase
      .from("orders")
      .select(`
        id, user_id, total_price, status, delivery_method, notes, created_at, updated_at,
        profile:profiles(full_name),
        items:order_items(id, quantity, unit_price, product:products(id, name))
      `)
      .order("created_at", { ascending: order === "asc" });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return ok(data ?? []);
  } catch (err) {
    return fail("ORDERS_FETCH_FAILED", "Could not load orders.", err.message);
  }
}
