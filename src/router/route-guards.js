const CUSTOMER_ONLY_ROUTES = new Set(["/profile", "/cart", "/checkout", "/my-orders"]);
const ADMIN_ONLY_ROUTES = new Set([
  "/admin-dashboard",
  "/manage-products",
  "/manage-recipes",
  "/manage-articles",
  "/manage-orders",
]);
const GUEST_ONLY_ROUTES = new Set(["/login", "/register"]);

const AUTH_RETURN_PATH_KEY = "auth:returnPath";

export function getDefaultRouteForRole(role) {
  if (role === "administrator") return "/admin-dashboard";
  if (role === "customer") return "/profile";
  return "/home";
}

export function rememberRequestedPath(path) {
  sessionStorage.setItem(AUTH_RETURN_PATH_KEY, path);
}

export function consumeRequestedPath() {
  const requested = sessionStorage.getItem(AUTH_RETURN_PATH_KEY);
  if (requested) {
    sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
    return requested;
  }
  return null;
}

export function resolveRouteGuard(path, authState) {
  const isGuest = !authState.isAuthenticated;
  const role = authState.role;

  if (ADMIN_ONLY_ROUTES.has(path)) {
    if (isGuest) {
      rememberRequestedPath(path);
      return { redirectPath: "/login" };
    }

    if (role !== "administrator") {
      return { redirectPath: "/home" };
    }

    return { redirectPath: null };
  }

  if (CUSTOMER_ONLY_ROUTES.has(path)) {
    if (isGuest) {
      rememberRequestedPath(path);
      return { redirectPath: "/login" };
    }

    return { redirectPath: null };
  }

  if (GUEST_ONLY_ROUTES.has(path) && !isGuest) {
    return { redirectPath: getDefaultRouteForRole(role) };
  }

  return { redirectPath: null };
}
