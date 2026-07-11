import { setMainContent } from "../components/main-content/main-content.js";
import { mountHeader } from "../components/header/header.js";
import { defaultRoute, routes } from "./routes.js";

function normalizeRoute(hashValue) {
  const clean = hashValue.replace(/^#/, "").trim();
  return clean || defaultRoute;
}

async function renderRoute() {
  const path = normalizeRoute(window.location.hash);
  const loader = routes[path] || routes[defaultRoute];

  if (!routes[path]) {
    window.location.hash = `#${defaultRoute}`;
    return;
  }

  const pageModule = await loader();
  const pageHtml = pageModule.render();

  mountHeader(path);
  setMainContent(pageHtml);

  if (typeof pageModule.mount === "function") {
    pageModule.mount();
  }
}

export function initRouter() {
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
}
