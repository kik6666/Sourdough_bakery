import { setMainContent } from "../components/main-content/main-content.js";
import { mountHeader } from "../components/header/header.js";
import { getAuthState, initAuthState, subscribeAuthState } from "../auth/auth-state.js";
import { resolveRouteGuard } from "./route-guards.js";
import { defaultRoute, routes } from "./routes.js";

function normalizeRoute(hashValue) {
  const clean = hashValue.replace(/^#/, "").trim();
  return clean || defaultRoute;
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
