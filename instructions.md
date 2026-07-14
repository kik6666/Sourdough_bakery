# Copilot Instructions - Sourdough Bakery

## Project context
Sourdough Bakery is a multi-page JavaScript application built with Vite, Bootstrap 5, and Supabase.
The project must stay framework-free: no React, Vue, Angular, or TypeScript.

## Core stack
- Frontend: HTML, CSS, JavaScript (ES modules), Bootstrap 5
- Build tools: Node.js, npm, Vite
- Backend: Supabase (Database, Auth, Storage)
- Deployment target: Netlify

## Architecture rules
- Keep a modular structure under src/:
  - pages/ for page modules
  - components/ for reusable UI blocks
  - services/ for Supabase and data access
  - utilities/ for shared helpers
  - styles/ for global styles and tokens
  - assets/ for local media
- Keep each page in separate files (HTML/CSS/JS as needed).
- Reuse shared modules. Avoid monolithic scripts.
- Preserve existing architecture and avoid unrelated refactors.

## Routing and page model
- Use route definitions from src/router/routes.js.
- Keep hash-route navigation consistent (for example: #/home, #/products).
- Every new route must have:
  - page module export(s)
  - route registration
  - navigation entry if user-facing
  - guard logic if role-restricted

## Auth and authorization
- Use Supabase Auth only for login/register/session.
- Enforce role behavior in UI and route guards:
  - guest
  - customer
  - administrator
- Never rely on frontend checks alone for sensitive data.
- Keep/extend RLS policies in migrations when data access changes.

## Database and migrations
- Use relational modeling with foreign keys.
- Keep schema normalized.
- Every schema change must be delivered as a migration in supabase/migrations/.
- Do not make untracked manual schema edits.

## Storage
- Use Supabase Storage for image uploads (products/recipes/articles/avatars).
- Validate file type and size before upload.
- Apply bucket and object access rules through Supabase policies.

## UI and responsiveness
- Build mobile-first layouts where practical.
- Use Bootstrap grid and utilities before custom CSS.
- Ensure key pages work on desktop, tablet, and mobile.
- Keep forms usable and validate user input.

## Code quality expectations
- Prefer clear names and small single-purpose functions.
- Avoid duplicate logic and magic values.
- Keep side effects inside services or mount/unmount handlers.
- Add concise error handling and user-friendly messages.

## Change safety
- Make minimal, targeted changes.
- Do not remove existing functionality unless explicitly requested.
- Verify behavior after changes:
  1) run
  2) verify
  3) fix errors
  4) stop

## Capstone completion checklist
When implementing features, prioritize:
- Functional user journeys over placeholders
- Admin management pages with real CRUD behavior
- Cart, checkout, and my orders integration
- Documentation and deployment readiness
