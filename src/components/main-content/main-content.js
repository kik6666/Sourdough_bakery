import template from "./main-content.html?raw";
import "./main-content.css";

export function renderMainContentShell() {
  return `<main id="site-main" class="page-shell">${template}</main>`;
}

export function setMainContent(html) {
  const container = document.getElementById("page-container");
  if (!container) return;
  container.innerHTML = html;
}
