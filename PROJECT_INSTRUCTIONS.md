# Sourdough Bakery - Project Instructions

## 1) Project Overview

**Project Name:** Sourdough Bakery

Sourdough Bakery is a modern multi-page artisan sourdough bakery website with an integrated online shop.

The website must:
- Present the bakery and its brand story
- Explain sourdough fermentation process
- Showcase handcrafted bakery products
- Share recipes and educational articles
- Allow registered users to place online orders
- Allow administrators to manage products, recipes, articles, images, and customer orders

---

## 2) Capstone Goal

Build a complete end-to-end Multi-Page Application that satisfies SoftUni Software Technologies with AI Capstone requirements.

---

## 3) Required Tech Stack

Use all of the following:
- HTML
- CSS
- JavaScript (ES Modules)
- Bootstrap 5 (CSS + JS components)
- Node.js
- npm
- Vite
- Supabase
- GitHub
- Netlify

Do not use:
- React
- Vue
- Angular
- TypeScript

---

## 4) Architecture Requirements

The app must follow a modular structure and avoid monolithic JavaScript files.

Separate by responsibility:
- pages
- components
- services
- utilities
- styles
- assets

Use reusable components wherever possible.

Suggested structure:

```text
src/
  pages/
  components/
  services/
  utilities/
  styles/
  assets/
public/
```

---

## 5) Application Type

This project must be a Multi-Page Application (MPA).

Rules:
- Each page should have its own HTML file
- Each page should have dedicated CSS/JS modules when appropriate
- Shared logic should be extracted to reusable modules

---

## 6) Responsive Design

The website must work correctly on:
- Desktop
- Tablet
- Mobile

Guidelines:
- Use Bootstrap 5 responsive grid and utility classes
- Keep layouts mobile-first where possible
- Verify navigation, cards, forms, tables, and media behavior at common breakpoints

---

## 7) User Roles and Permissions

### Guest Visitor
- Browse public pages
- View products, recipes, and articles
- No checkout or order history access

### Registered User
- Register and log in
- Manage personal profile
- Add products to cart
- Complete checkout and create orders
- View own orders

### Administrator
- Access admin dashboard
- Manage products
- Manage recipes
- Manage educational articles
- Manage uploaded images
- Manage all customer orders

---

## 8) Required Pages

### Public Pages
- Home
- About Us
- Sourdough
- Products
- Product Details
- Recipes
- Good to Know
- Contact

### Authenticated Pages
- Login
- Register
- Profile
- Cart
- Checkout
- My Orders

### Admin Pages
- Admin Dashboard
- Manage Products
- Manage Recipes
- Manage Articles
- Manage Orders

---

## 9) Backend Requirements (Supabase)

Use Supabase for backend services:
- Supabase Database
- Supabase Authentication
- Supabase Storage

Security:
- Enable and use Row Level Security (RLS)
- Implement role-based access policies for user/admin data isolation

---

## 10) Database Requirements

- Use relational tables with proper foreign keys
- Normalize schema (avoid unnecessary duplication)
- Keep user, product, recipe, article, cart/order data logically separated
- Use migrations for every schema change
- Keep migration history consistent and versioned

---

## 11) Development Standards

- Write clean, modular, maintainable code
- Avoid duplicated code
- Prefer reusable functions/components
- Use meaningful file names
- Use meaningful variable names

---

## 12) Workflow Requirement

After implementation cycle:
1. Run
2. Verify
3. Fix errors
4. Stop

Do not continue with additional features after this cycle unless explicitly requested.

---

## 13) Scope and Change Management

- Preserve existing project architecture
- Do not refactor unrelated code
- Do not remove existing functionality unless explicitly requested

---

## 14) Build Intent

This document defines the target product and constraints for the Sourdough Bakery capstone website and should be used as the primary implementation reference during development.
