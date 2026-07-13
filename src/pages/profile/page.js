import template from "./index.html?raw";
import "./styles.css";
import { getAuthState, refreshAuthState } from "../../auth/auth-state.js";
import { updateOwnProfile } from "../../services/index.js";

export function render() {
  return template;
}

export function mount() {
  document.title = "Sourdough Bakery | Profile";

  const form = document.getElementById("profile-form");
  const emailInput = document.getElementById("profile-email");
  const fullNameInput = document.getElementById("profile-full-name");
  const phoneInput = document.getElementById("profile-phone");
  const addressInput = document.getElementById("profile-address");
  const statusEl = document.getElementById("profile-status");
  const saveBtn = document.getElementById("profile-save");

  if (!form || !emailInput || !fullNameInput || !phoneInput || !addressInput || !statusEl || !saveBtn) {
    return;
  }

  const authState = getAuthState();
  if (!authState.isAuthenticated || !authState.user) {
    window.location.hash = "#/login";
    return;
  }

  const user = authState.user;
  const profile = authState.profile;

  emailInput.value = user.email || "";
  fullNameInput.value = profile?.full_name || "";
  phoneInput.value = profile?.phone || "";
  addressInput.value = profile?.address || "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    statusEl.textContent = "";
    saveBtn.disabled = true;

    const formData = new FormData(form);
    const payload = {
      full_name: String(formData.get("fullName") || "").trim(),
      phone: String(formData.get("phone") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
    };

    try {
      await updateOwnProfile(user.id, payload);
      await refreshAuthState();
      statusEl.textContent = "Profile updated successfully.";
    } catch (error) {
      statusEl.textContent = error?.message || "Profile update failed. Please try again.";
    } finally {
      saveBtn.disabled = false;
    }
  });
}
