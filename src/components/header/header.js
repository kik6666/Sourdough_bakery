import template from "./header.html?raw";
import "./header.css";
import "../main-navigation/main-navigation.css";
import { signOut } from "../../services/index.js";
import { mountMainNavigation } from "../main-navigation/main-navigation.js";

export function renderHeader() {
  return template;
}

export function mountHeader(currentPath, authState) {
  mountMainNavigation(currentPath, authState);

  if (authState?.isAuthenticated) {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await signOut();
          window.location.hash = "#/home";
        } catch {
          // Keep the UI responsive even if sign-out fails transiently.
          window.location.hash = "#/home";
        }
      });
    }
  }
}
