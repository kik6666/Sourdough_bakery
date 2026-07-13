import { setMainContent } from "../components/main-content/main-content.js";
import { mountHeader } from "../components/header/header.js";
import { getAuthState, initAuthState, subscribeAuthState } from "../auth/auth-state.js";
import { resolveRouteGuard } from "./route-guards.js";
import { defaultRoute, routes } from "./routes.js";

function normalizeRoute(hashValue) {
  const clean = hashValue.replace(/^#/, "").trim();
  // Strip query string before route matching so links like
  // #/products?category=bread resolve to the /products route.
  const path = clean.split("?")[0];
  return path || defaultRoute;
}

/**
 * Returns the current URL query params as an object.
 * Call this from any page's mount() to read e.g. { category: "bread" }.
 */
export function getRouteParams() {
  const hash = window.location.hash.replace(/^#/, "");
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return {};
  return Object.fromEntries(new URLSearchParams(hash.slice(queryIndex + 1)));
}

async function renderRoute() {
  const path = normalizeRoute(window.location.hash);

  if (!routes[path]) {
    window.location.hash = `#${defaultRoute}`;
    return;
  }

  const authState = getAuthState();
  const { redirectPath } = resolveRouteGuard(path, authState);
  if (redirectPath && redirectPath !== path) {
    window.location.hash = `#${redirectPath}`;
    return;
  }

  const loader = routes[path] || routes[defaultRoute];

  const pageModule = await loader();
  const pageHtml = pageModule.render();

  mountHeader(path, authState);
  setMainContent(pageHtml);

  if (typeof pageModule.mount === "function") {
    pageModule.mount();
  }
}

export function initRouter() {
  initAuthState().then(() => {
    renderRoute();
  });

  subscribeAuthState(() => {
    renderRoute();
  });

  window.addEventListener("hashchange", renderRoute);
}
