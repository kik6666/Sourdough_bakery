import { getSession } from "./auth-service.js";
import { supabase } from "./supabase-client.js";

const PRODUCT_COLUMNS = "id, name, slug, price, image_url, in_stock, is_active";
const CART_ITEM_COLUMNS = `
  id,
  order_id,
  product_id,
  quantity,
  unit_price,
  product:products(${PRODUCT_COLUMNS})
`;

function toError(code, message, details = null) {
  return {
    code,
    message,
    details,
  };
}

function ok(data) {
  return {
    ok: true,
    data,
    error: null,
  };
}

function fail(code, message, details = null) {
  return {
    ok: false,
    data: null,
    error: toError(code, message, details),
  };
}

function normalizeQuantity(quantity) {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

async function getAuthenticatedUserId() {
  const session = await getSession();
  return session?.user?.id || null;
}

async function getPendingOrder(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, user_id, total_price, status, created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getOrCreatePendingOrder(userId) {
  const existing = await getPendingOrder(userId);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      total_price: 0,
    })
    .select("id, user_id, total_price, status, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getAvailableProduct(productId) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return fail("PRODUCT_NOT_FOUND", "Product does not exist.");
  }

  if (!data.is_active || !data.in_stock) {
    return fail("PRODUCT_UNAVAILABLE", "Product is currently unavailable.", {
      productId,
    });
  }

  return ok(data);
}

function computeCartLines(items) {
  const lines = items.map((item) => {
    const lineTotal = Number(item.unit_price) * Number(item.quantity);
    return {
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal,
      product: item.product,
    };
  });

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return {
    items: lines,
    total,
  };
}

async function getOrderItems(orderId) {
  const { data, error } = await supabase
    .from("order_items")
    .select(CART_ITEM_COLUMNS)
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function syncOrderTotal(orderId) {
  const items = await getOrderItems(orderId);
  const { total } = computeCartLines(items);

  const { error } = await supabase
    .from("orders")
    .update({ total_price: total })
    .eq("id", orderId);

  if (error) {
    throw error;
  }

  return total;
}

async function getCurrentCartByUserId(userId) {
  const pendingOrder = await getPendingOrder(userId);

  if (!pendingOrder) {
    return {
      orderId: null,
      status: "pending",
      items: [],
      total: 0,
    };
  }

  const items = await getOrderItems(pendingOrder.id);
  const computed = computeCartLines(items);

  return {
    orderId: pendingOrder.id,
    status: pendingOrder.status,
    items: computed.items,
    total: computed.total,
  };
}

export async function getCart() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return fail("AUTH_REQUIRED", "You must be authenticated to access cart.");
    }

    const cart = await getCurrentCartByUserId(userId);
    return ok(cart);
  } catch (error) {
    return fail("CART_FETCH_FAILED", "Could not fetch cart.", error.message);
  }
}

export async function addToCart(productId, quantity) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return fail("AUTH_REQUIRED", "You must be authenticated to modify cart.");
    }

    const normalizedQuantity = normalizeQuantity(quantity);
    if (!normalizedQuantity) {
      return fail("INVALID_QUANTITY", "Quantity must be a positive integer.", {
        quantity,
      });
    }

    const productResult = await getAvailableProduct(productId);
    if (!productResult.ok) {
      return productResult;
    }

    const product = productResult.data;
    const order = await getOrCreatePendingOrder(userId);

    const { data: existingItem, error: existingError } = await supabase
      .from("order_items")
      .select("id, quantity")
      .eq("order_id", order.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingItem) {
      const { error: updateError } = await supabase
        .from("order_items")
        .update({
          quantity: existingItem.quantity + normalizedQuantity,
          unit_price: product.price,
        })
        .eq("id", existingItem.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        quantity: normalizedQuantity,
        unit_price: product.price,
      });

      if (insertError) {
        throw insertError;
      }
    }

    await syncOrderTotal(order.id);
    const cart = await getCurrentCartByUserId(userId);

    return ok(cart);
  } catch (error) {
    return fail("ADD_TO_CART_FAILED", "Could not add product to cart.", error.message);
  }
}

export async function updateQuantity(productId, quantity) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return fail("AUTH_REQUIRED", "You must be authenticated to modify cart.");
    }

    const normalizedQuantity = normalizeQuantity(quantity);
    if (!normalizedQuantity) {
      return fail("INVALID_QUANTITY", "Quantity must be a positive integer.", {
        quantity,
      });
    }

    const order = await getPendingOrder(userId);
    if (!order) {
      return fail("CART_NOT_FOUND", "No active cart found.");
    }

    const productResult = await getAvailableProduct(productId);
    if (!productResult.ok) {
      return productResult;
    }

    const { data: existingItem, error: existingError } = await supabase
      .from("order_items")
      .select("id")
      .eq("order_id", order.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existingItem) {
      return fail("ITEM_NOT_FOUND", "Product is not present in cart.", { productId });
    }

    const { error: updateError } = await supabase
      .from("order_items")
      .update({
        quantity: normalizedQuantity,
        unit_price: productResult.data.price,
      })
      .eq("id", existingItem.id);

    if (updateError) {
      throw updateError;
    }

    await syncOrderTotal(order.id);
    const cart = await getCurrentCartByUserId(userId);

    return ok(cart);
  } catch (error) {
    return fail("UPDATE_QUANTITY_FAILED", "Could not update cart item quantity.", error.message);
  }
}

export async function removeFromCart(productId) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return fail("AUTH_REQUIRED", "You must be authenticated to modify cart.");
    }

    const order = await getPendingOrder(userId);
    if (!order) {
      return fail("CART_NOT_FOUND", "No active cart found.");
    }

    const { data: existingItem, error: existingError } = await supabase
      .from("order_items")
      .select("id")
      .eq("order_id", order.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existingItem) {
      return fail("ITEM_NOT_FOUND", "Product is not present in cart.", { productId });
    }

    const { error: deleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("id", existingItem.id);

    if (deleteError) {
      throw deleteError;
    }

    await syncOrderTotal(order.id);
    const cart = await getCurrentCartByUserId(userId);

    return ok(cart);
  } catch (error) {
    return fail("REMOVE_FROM_CART_FAILED", "Could not remove product from cart.", error.message);
  }
}

export async function clearCart() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return fail("AUTH_REQUIRED", "You must be authenticated to modify cart.");
    }

    const order = await getPendingOrder(userId);
    if (!order) {
      return ok({
        orderId: null,
        status: "pending",
        items: [],
        total: 0,
      });
    }

    const { error: deleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", order.id);

    if (deleteError) {
      throw deleteError;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ total_price: 0 })
      .eq("id", order.id);

    if (updateError) {
      throw updateError;
    }

    return ok({
      orderId: order.id,
      status: order.status,
      items: [],
      total: 0,
    });
  } catch (error) {
    return fail("CLEAR_CART_FAILED", "Could not clear cart.", error.message);
  }
}

export async function getCartTotal() {
  const result = await getCart();
  if (!result.ok) {
    return result;
  }

  return ok({
    total: result.data.total,
    currency: "BGN",
  });
}
