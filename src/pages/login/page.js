import template from "./index.html?raw";
import "./styles.css";
import { getAuthState, refreshAuthState } from "../../auth/auth-state.js";
import { signInWithPassword } from "../../services/index.js";
import { consumeRequestedPath, getDefaultRouteForRole } from "../../router/route-guards.js";

export function render() {
  return template;
}

export function mount() {
  document.title = "Sourdough Bakery | Login";

  const form = document.getElementById("login-form");
  const statusEl = document.getElementById("login-status");
  const submitBtn = document.getElementById("login-submit");
  if (!form || !statusEl || !submitBtn) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    statusEl.textContent = "";
    submitBtn.disabled = true;

    try {
      await signInWithPassword({ email, password });
      const authState = await refreshAuthState();
      const requestedPath = consumeRequestedPath();
      const redirect = requestedPath || getDefaultRouteForRole(authState.role);

      window.location.hash = `#${redirect}`;
    } catch (error) {
      statusEl.textContent = error?.message || "Login failed. Please try again.";
    } finally {
      submitBtn.disabled = false;
    }
  });

  const authState = getAuthState();
  if (authState.isAuthenticated) {
    window.location.hash = `#${getDefaultRouteForRole(authState.role)}`;
  }
}
