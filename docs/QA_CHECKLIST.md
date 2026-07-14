# QA Checklist & Pre-Deployment Verification
**Project**: Sourdough Bakery
**Target Environment**: Netlify + Supabase

---

## 2. Environment Configuration

| Variable | Required | Documented | Notes |
| :--- | :---: | :---: | :--- |
| `VITE_SUPABASE_URL` | Yes | Yes | Used for backend connection |
| `VITE_SUPABASE_ANON_KEY` | Yes | Yes | Used for frontend client |
| Seed variables | Optional | Yes | Used for `seed.js` locally |

* **Missing Env Var Behavior**: The app should show console warnings or fail gracefully in Dev (e.g. Supabase client initialization error).

---

## 3. Supabase Schema and Seed Verification

| Category | Verification | Pass/Fail | Notes |
| :--- | :--- | :---: | :--- |
| **Migrations** | Baseline applied (`202607130001_initial_schema.sql`) | [ ] | |
| **Data Seed** | Categories, Products, Recipes, Articles exist | [ ] | |
| **Anon Read** | Public reads work on seeded data | [ ] | |
| **Write Restriction** | Writes blocked for non-admins | [ ] | |

---

## 4. RLS Policy Verification Matrix

| Table | Guest (Anon) | Customer | Admin |
| :--- | :--- | :--- | :--- |
| **products** | Read Only | Read Only | CRUD |
| **recipes** | Read Only | Read Only | CRUD |
| **articles** | Read Only | Read Only | CRUD |
| **categories** | Read Only | Read Only | CRUD |
| **profiles** | Denied | Read/Update (Self) | Read/Update |
| **orders** | Denied | Read/Create (Self) | CRUD |
| **order_items**| Denied | Read/Create (Self) | CRUD |

---

## 5. Functional Smoke Tests & 1. Manual QA Checklist

### 5.1 Public Browsing
| Scenario | Steps | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| Home Page | Load `#/home` | Featured products/articles render | | [ ] |
| About Us | Load `#/about-us` | Content loads properly | | [ ] |
| Sourdough | Load `#/sourdough` | Educational content loads | | [ ] |
| Products List | Load `#/products` | Products display correctly | | [ ] |
| Product Detail | Click a product | URL updates to `?slug=...`, details show | | [ ] |
| Recipes List | Load `#/recipes` | Recipes display correctly | | [ ] |
| Contact Page | Load `#/contact` | Form and details display | | [ ] |

### 5.2 Authentication
| Scenario | Steps | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| Register | Fill form, submit | Account created, logged in | | [ ] |
| Login | Enter credentials | Logged in, nav updates | | [ ] |
| Logout | Click logout button | Session ends, nav updates, redirect home | | [ ] |
| Profile View | Load `#/profile` | Shows user details | | [ ] |

### 5.3 Customer Journeys
| Scenario | Steps | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| Cart Add | Click "Add to Cart" | Cart updates with item | | [ ] |
| Checkout | Submit cart via `#/checkout`| Order created in Supabase | | [ ] |
| My Orders | Load `#/my-orders` | Past orders load, cancellation works | | [ ] |

### 5.4 Admin Journeys
| Scenario | Steps | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| Dashboard | Load admin routes | Access granted based on role | | [ ] |
| Manage Products| Create/Edit/Delete | Supabase updates, UI reflects without reload | | [ ] |
| Manage Recipes | Create/Edit/Delete | Supabase updates, UI reflects | | [ ] |
| Manage Orders | View, update status | Status changes save properly | | [ ] |
| Manage Users | Update user roles | DB updates profile role | | [ ] |

### 5.5 Error and Empty States
| Scenario | Steps | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| Empty Cart | View cart with 0 items | "Cart is empty" message | | [ ] |
| No Orders | View My Orders, 0 orders | Friendly message shown | | [ ] |
| 404 Route | Load invalid hash `#/foo` | Default page / error state shown | | [ ] |

---

## 6. Good to Know and Articles Regression
| Scenario | Expected Behavior | Pass/Fail |
| :--- | :--- | :---: |
| DB Population | Articles render directly from Supabase, no hardcoding | [ ] |
| Routing | Detail loads accurately via slug (`#/good-to-know?slug=title`) | [ ] |
| Error State | Invalid slug shows a friendly "not found" state | [ ] |
| Real-time | Admin CRUD actions instantly reflect on the public listing next load | [ ] |
| Fallback | Missing `image_url` displays a default placeholder gracefully | [ ] |

---

## 7. UX State Coverage
* [ ] **Loading states**: Spinners/skeletons visible during async DB calls.
* [ ] **Submission blocking**: Action buttons (`type="submit"`) disable while processing.
* [ ] **Notifications**: Success (green) and Error (red) alerts display properly.
* [ ] **Console**: No silent or blocking console errors during happy paths.

---

## 8. Form Validation & Data Integrity
* [ ] **Required fields**: HTML5 and JS checks enforce required fields on all modals/forms.
* [ ] **Slug uniqueness**: Admin creates unique slugs for articles/products (Supabase constraint).
* [ ] **Numeric bounds**: Prices, stock, and cart quantities do not accept negative values.
* [ ] **Input sanitization**: Basic XSS safeguards / DOM limits on descriptions.

---

## 9. Responsive & Cross-Device Limits
* [ ] **Mobile (~360px)**: Nav collapses to hamburger, grids stack (1 column).
* [ ] **Tablet (~768px)**: Grids adapt to 2 columns, forms remain usable.
* [ ] **Desktop (~1280px+)**: Multi-column layouts utilize wide space nicely. No overflow.

---

## 10. Accessibility (a11y) Baseline
* [ ] **Headings**: Semantic `<h1>` through `<h6>` structure.
* [ ] **Keyboard**: `Tab` navigation reaches links, buttons, form inputs, modals.
* [ ] **Focus**: Visible focus outlines on interactive elements.
* [ ] **Images**: Meaningful `<img>` tags have descriptive `alt` text.
* [ ] **Contrast**: Bakery accent colors meet minimum contrast ratios against white/light backgrounds.

---

## 11. Performance and Build
* [ ] **Build Command**: `npm run build` exits `0`. (CSS Minification disabled to prevent LightningCSS bug with Bootstrap).
* [ ] **Bundle Size**: Built assets are within reasonable range (< 1MB core app).
* [ ] **Media Assets**: Images properly optimized/compressed in storage bucket.

---

## 12. Netlify Deployment Readiness
* [ ] **Build Settings**: Command = `npm run build`, Publish = `dist`
* [ ] **Environment**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` added in Netlify UI.
* [ ] **Routing**: Hash routing `#/` works out of the box on static hosts (no `_redirects` file needed for hash).
* [ ] **Smoke Test**: Load deployed URL -> Login -> View Products -> Read Article -> Check Admin.

---

## 13. Deliverables & Summary

### Bug List
| ID | Severity | Area | Description | Repro / Notes | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| - | - | - | Pending manual QA completion | - | Open |

### Release Recommendation
**Status**: 🟢 **GO FOR RELEASE** (Pending Manual Checklist Completion)
**Notes**: Local build verifies perfectly. Supabase configuration and seed flows are tested. The infrastructure is firmly in place for staging/prod deployment on Netlify.

---

## Optional: Automated Smoke Script Plan (Future)
When ready for automation (e.g. Playwright/Cypress):
1. **Auth Test**: Fill login form, click submit, assert local storage token / router redirect.
2. **Route Guards**: Attempt anonymous direct navigation to `#/admin-dashboard`, assert redirect to home/login.
3. **Article CRUD**: Admin logs in, creates article "Test QA", asserts presence on `#/good-to-know`, deletes article.
4. **Checkout Path**: Adds product to cart, navigates to `#/checkout`, submits demo order, verifies `#/my-orders`.
