import template from "./header.html?raw";
import "./header.css";
import "../main-navigation/main-navigation.css";
import { signOut } from "../../services/index.js";
import { mountMainNavigation } from "../main-navigation/main-navigation.js";

function initScrollShadow() {
  const navbar = document.getElementById("main-navbar");
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 8) {
      navbar.classList.add("navbar-scrolled");
    } else {
      navbar.classList.remove("navbar-scrolled");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

export function renderHeader() {
  return template;
}

export function mountHeader(currentPath, authState) {
  mountMainNavigation(currentPath, authState);
  initScrollShadow();

  if (authState?.isAuthenticated) {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await signOut();
          window.location.hash = "#/home";
        } catch {
          window.location.hash = "#/home";
        }
      });
    }
  }
}
