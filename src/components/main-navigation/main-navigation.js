const primaryLinks = [
  { path: "/home", label: "Home" },
  { path: "/about-us", label: "About Us" },
  { path: "/sourdough", label: "About Sourdough" },
  { path: "/products", label: "Products" },
  { path: "/recipes", label: "Recipes" },
  { path: "/good-to-know", label: "Good to Know" },
  { path: "/contact", label: "Contact" },
];

function renderPrimaryLinks(currentPath) {
  return primaryLinks
    .map(
      (item) => `
        <li class="nav-item">
          <a class="nav-link ${item.path === currentPath ? "active" : ""}" href="#${item.path}">${item.label}</a>
        </li>
      `,
    )
    .join("");
}

function renderAuthActions(authState, currentPath) {
  if (!authState?.isAuthenticated) {
    return `
      <a class="btn btn-outline-secondary btn-sm ${currentPath === "/login" ? "active" : ""}" href="#/login">Login</a>
      <a class="btn btn-primary btn-sm ${currentPath === "/register" ? "active" : ""}" href="#/register">Register</a>
    `;
  }

  const adminLink =
    authState.role === "administrator"
      ? `<a class="btn btn-outline-primary btn-sm ${currentPath === "/admin-dashboard" ? "active" : ""}" href="#/admin-dashboard">Admin Dashboard</a>`
      : "";

  return `
    ${adminLink}
    <a class="btn btn-outline-secondary btn-sm ${currentPath === "/profile" ? "active" : ""}" href="#/profile">Profile</a>
    <button class="btn btn-danger btn-sm" type="button" id="logout-btn">Logout</button>
  `;
}

export function mountMainNavigation(currentPath, authState) {
  const primaryHost = document.getElementById("primary-nav-links");
  const authActionsHost = document.getElementById("auth-nav-actions");

  if (!primaryHost || !authActionsHost) return;

  primaryHost.innerHTML = renderPrimaryLinks(currentPath);
  authActionsHost.innerHTML = renderAuthActions(authState, currentPath);
}
