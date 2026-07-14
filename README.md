# Sourdough Bakery

Multi-page JavaScript capstone project for SoftUni Software Technologies with AI.

## Live Project
- URL: https://sourdoughbakeryexamproject.netlify.app 

## Repository
- GitHub: https://github.com/kik6666/Sourdough_bakery 

## Demo Credentials
- Customer: irina@yahoo.com pass: 123456
- Admin: petya@abv.bg pass: 123456

## Tech Stack
- HTML, CSS, JavaScript (ES Modules)
- Bootstrap 5
- Vite
- Supabase (Database, Authentication, Storage)
- Node.js, npm

## Project Structure
- src/pages - page modules
- src/components - shared UI components
- src/services - Supabase and data services
- src/utilities - reusable helpers
- src/styles - global styles and tokens
- src/router - routes and guards
- supabase/migrations - database migrations

## Required Environment Variables
Create a .env file in the project root:

VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

Optional for seeding:
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

## Local Development
1. Install dependencies:
   npm install
2. Run dev server:
   npm run dev
3. Build for production:
   npm run build
4. Preview production build:
   npm run preview

## Database and Migrations
- Initial migration: supabase/migrations/202607130001_initial_schema.sql
- Apply migrations with Supabase CLI before running full flows.

## User Roles
- Guest: browse public pages
- Customer: profile, cart, checkout, my orders
- Administrator: dashboard and management pages

## Main Pages
- Home, About Us, Sourdough, Products, Product Details
- Recipes, Good to Know, Contact
- Login, Register, Profile
- Cart, Checkout, My Orders
- Admin Dashboard, Manage Products, Manage Recipes, Manage Articles, Manage Orders, Manage Users

## Notes
- This project is framework-free (no React, Vue, Angular, TypeScript).
- Uses hash-based routes (example: #/home, #/products).

## Deployment
- Target platform: Netlify
- Final deployed URL: TODO

## Submission Checklist
- Fill in Live Project URL
- Fill in GitHub Repo URL
- Fill in demo credentials
- Verify all required user flows
- Ensure deployment is accessible
