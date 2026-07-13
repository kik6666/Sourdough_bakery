const primaryLinks = [
  { path: "/home", label: "Home" },
  { path: "/about-us", label: "About Us" },
  { path: "/sourdough", label: "About Sourdough" },
  { path: "/products", label: "Products" },
  { path: "/recipes", label: "Recipes" },
  { path: "/good-to-know", label: "Good to Know" },
  { path: "/contact", label: "Contact" },
];

function active(path, currentPath) {
  return path === currentPath ? " active" : "";
}

function renderPrimaryLinks(currentPath) {
  return primaryLinks
    .map(
      (item) =>
        `<li class="nav-item">
          <a class="nav-link${active(item.path, currentPath)}" href="#${item.path}">${item.label}</a>
        </li>`,
    )
    .join("");
}

function renderGuestActions(currentPath) {
  return `
    <a class="btn btn-nav-login${active("/login", currentPath)}" href="#/login">Login</a>
    <a class="btn btn-nav-register${active("/register", currentPath)}" href="#/register">Register</a>
  `;
}

function renderCustomerActions(currentPath) {
  return `
    <a class="btn btn-nav-ghost${active("/profile", currentPath)}" href="#/profile">Profile</a>
    <a class="btn btn-nav-ghost${active("/my-orders", currentPath)}" href="#/my-orders">My Orders</a>
    <button class="btn btn-nav-logout" type="button" id="logout-btn">Logout</button>
  `;
}

function renderAdminActions(currentPath) {
  return `
    <a class="btn btn-nav-admin${active("/admin-dashboard", currentPath)}" href="#/admin-dashboard">Admin Dashboard</a>
    <button class="btn btn-nav-logout" type="button" id="logout-btn">Logout</button>
  `;
}

function renderAuthActions(authState, currentPath) {
  if (!authState?.isAuthenticated) {
    return renderGuestActions(currentPath);
  }

  if (authState.role === "administrator") {
    return renderAdminActions(currentPath);
  }

  return renderCustomerActions(currentPath);
}

export function mountMainNavigation(currentPath, authState) {
  const primaryHost = document.getElementById("primary-nav-links");
  const authActionsHost = document.getElementById("auth-nav-actions");

  if (!primaryHost || !authActionsHost) return;

  primaryHost.innerHTML = renderPrimaryLinks(currentPath);
  authActionsHost.innerHTML = renderAuthActions(authState, currentPath);
}
