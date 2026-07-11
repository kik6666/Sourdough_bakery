# Sourdough Bakery - General Rules

## A) Core Principles

- Build with plain HTML, CSS, and JavaScript ES Modules
- Use Bootstrap 5 components/utilities before custom implementations
- Keep code modular, readable, and easy to maintain
- Reuse existing components and helper modules whenever possible

---

## B) Non-Negotiable Constraints

- Multi-Page Application only
- No React, Vue, Angular, or TypeScript
- Use Node.js + npm + Vite for development/build
- Use Supabase for DB/Auth/Storage
- Use GitHub for version control
- Deploy target: Netlify

---

## C) File and Module Organization

Use clear separation of concerns:
- pages: page-level scripts and templates
- components: reusable UI blocks
- services: API/Supabase calls
- utilities: shared helpers
- styles: global and page/component styles
- assets: images, icons, static media

Rules:
- Keep files focused on one responsibility
- Avoid giant all-in-one files
- Extract repeated logic to utilities/services/components

---

## D) Frontend Implementation Rules

- Use Bootstrap 5 grid for layout
- Use Bootstrap 5 JS components where suitable (navbar, modal, dropdown, carousel, etc.)
- Keep custom CSS organized and minimal where Bootstrap already solves the task
- Maintain responsive behavior across desktop, tablet, and mobile
- Validate forms on client side before submit

---

## E) Authentication and Authorization Rules

- Use Supabase Auth for register/login/session management
- Enforce role-based behavior in UI (guest/user/admin)
- Never rely only on frontend checks for data protection
- Enforce permission rules with Supabase RLS policies

---

## F) Data and Database Rules

- Use relational modeling with proper keys
- Keep schema normalized
- Add migrations for every schema change
- Keep migration files ordered and descriptive
- Avoid direct schema edits without migration tracking

---

## G) Coding Standards

- Prefer descriptive names for files, functions, and variables
- Keep functions small and single-purpose
- Avoid duplicated code and magic values
- Centralize configuration/constants
- Use clear error handling and user-friendly messages

---

## H) Testing and Verification Rule

After each meaningful implementation block:
1. Run the app
2. Verify behavior manually
3. Fix discovered errors
4. Stop (no extra unrequested features)

---

## I) Change Safety Rules

- Preserve established architecture
- Do not refactor unrelated parts
- Do not remove existing functionality unless explicitly requested
- Make minimal, targeted, reversible changes

---

## J) Delivery Readiness Checklist

Before considering a task done:
- Feature works for correct role(s)
- Responsive behavior verified
- No console errors in affected pages
- Supabase operations respect RLS and permissions
- Code is modular and aligned with project structure

---

## K) Project Vision Reminder

Sourdough Bakery should feel modern, educational, and commerce-ready, combining artisan brand presentation with a practical online ordering flow and clear administrative control.
