import { renderHeader } from "./components/header/header.js";
import { renderFooter } from "./components/footer/footer.js";
import { renderMainContentShell } from "./components/main-content/main-content.js";
import { initRouter } from "./router/router.js";

export function mountApp() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div id="layout-root" class="d-flex flex-column min-vh-100">
      <header id="site-header"></header>
      <div id="main-injector">
        ${renderMainContentShell()}
      </div>
      <footer id="site-footer" class="mt-auto"></footer>
    </div>
  `;

  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");

  headerHost.innerHTML = renderHeader();
  footerHost.innerHTML = renderFooter();

  initRouter();
}
