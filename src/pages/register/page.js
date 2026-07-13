import template from "./index.html?raw";
import "./styles.css";
import { getAuthState, refreshAuthState } from "../../auth/auth-state.js";
import { signUpWithPassword } from "../../services/index.js";
import { consumeRequestedPath, getDefaultRouteForRole } from "../../router/route-guards.js";

export function render() {
  return template;
}

export function mount() {
  document.title = "Sourdough Bakery | Register";

  const form = document.getElementById("register-form");
  const statusEl = document.getElementById("register-status");
  const submitBtn = document.getElementById("register-submit");
  if (!form || !statusEl || !submitBtn) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    statusEl.textContent = "";
    submitBtn.disabled = true;

    try {
      const result = await signUpWithPassword({ email, password, fullName });

      if (!result.session) {
        statusEl.textContent = "Registration successful. Please verify your email before logging in.";
        submitBtn.disabled = false;
        return;
      }

      const authState = await refreshAuthState();
      const requestedPath = consumeRequestedPath();
      const redirect = requestedPath || getDefaultRouteForRole(authState.role);
      window.location.hash = `#${redirect}`;
    } catch (error) {
      statusEl.textContent = error?.message || "Registration failed. Please try again.";
    } finally {
      submitBtn.disabled = false;
    }
  });

  const authState = getAuthState();
  if (authState.isAuthenticated) {
    window.location.hash = `#${getDefaultRouteForRole(authState.role)}`;
  }
}
