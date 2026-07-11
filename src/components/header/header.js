import template from "./header.html?raw";
import "./header.css";

const navItems = [
  { path: "/home", label: "Home" },
  { path: "/about-us", label: "About Us" },
  { path: "/sourdough", label: "Sourdough" },
  { path: "/products", label: "Products" },
  { path: "/product-details", label: "Product Details" },
  { path: "/recipes", label: "Recipes" },
  { path: "/good-to-know", label: "Good to Know" },
  { path: "/contact", label: "Contact" },
  { path: "/login", label: "Login" },
  { path: "/register", label: "Register" },
  { path: "/profile", label: "Profile" },
  { path: "/cart", label: "Cart" },
  { path: "/checkout", label: "Checkout" },
  { path: "/my-orders", label: "My Orders" },
  { path: "/admin-dashboard", label: "Admin Dashboard" },
  { path: "/manage-products", label: "Manage Products" },
  { path: "/manage-recipes", label: "Manage Recipes" },
  { path: "/manage-articles", label: "Manage Articles" },
  { path: "/manage-orders", label: "Manage Orders" },
];

export function renderHeader() {
  return template;
}

export function mountHeader(currentPath) {
  const navHost = document.getElementById("nav-links");
  if (!navHost) return;

  navHost.innerHTML = navItems
    .map(
      (item) => `
        <li class="nav-item">
          <a class="nav-link ${item.path === currentPath ? "active" : ""}" href="#${item.path}">${item.label}</a>
        </li>
      `,
    )
    .join("");
}
