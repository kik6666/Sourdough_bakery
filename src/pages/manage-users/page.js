import template from "./index.html?raw";
import "./styles.css";
import { getAuthState } from "../../auth/auth-state.js";

export function render() {
  return template;
}

export function mount() {
  document.title = "Sourdough Bakery | Manage Users";

  const authState = getAuthState();
  if (!authState.isAuthenticated || authState.role !== "administrator") {
    window.location.hash = "#/home";
  }
}
