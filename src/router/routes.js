export const routes = {
  "/home": () => import("../pages/home/page.js"),
  "/about-us": () => import("../pages/about-us/page.js"),
  "/sourdough": () => import("../pages/sourdough/page.js"),
  "/products": () => import("../pages/products/page.js"),
  "/product-details": () => import("../pages/product-details/page.js"),
  "/recipes": () => import("../pages/recipes/page.js"),
  "/good-to-know": () => import("../pages/good-to-know/page.js"),
  "/contact": () => import("../pages/contact/page.js"),
  "/login": () => import("../pages/login/page.js"),
  "/register": () => import("../pages/register/page.js"),
  "/profile": () => import("../pages/profile/page.js"),
  "/cart": () => import("../pages/cart/page.js"),
  "/checkout": () => import("../pages/checkout/page.js"),
  "/my-orders": () => import("../pages/my-orders/page.js"),
  "/admin-dashboard": () => import("../pages/admin-dashboard/page.js"),
  "/manage-products": () => import("../pages/manage-products/page.js"),
  "/manage-recipes": () => import("../pages/manage-recipes/page.js"),
  "/manage-articles": () => import("../pages/manage-articles/page.js"),
  "/manage-orders": () => import("../pages/manage-orders/page.js"),
  "/manage-users": () => import("../pages/manage-users/page.js"),
};

export const defaultRoute = "/home";
