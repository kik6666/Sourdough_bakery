# Database Schema Blueprint - KOMAT Bakery

## 1) Scope and Goals
This document defines the relational database architecture for the KOMAT Bakery web application using Supabase PostgreSQL.

Design goals:
- Keep data model normalized and maintainable
- Enforce referential integrity with primary and foreign keys
- Use explicit constraints for data quality
- Support role-based access via Supabase Auth + Row Level Security (RLS)
- Provide clean foundations for e-commerce and content modules

Note: This is a design blueprint only. No SQL implementation is included.

## 2) Roles and Access Context
Application roles:
- Guest: Not authenticated
- Customer: Authenticated user who shops and manages own orders
- Administrator: Authenticated user with elevated management access

Role source:
- User role is stored in `profiles.role`
- Expected values: `customer`, `administrator`
- `guest` is not stored in `profiles` because guests are unauthenticated

## 3) Core Design Decisions
- Key type: UUID for all primary keys (Supabase-friendly, globally unique)
- Timestamps: `created_at` for all content/transaction tables (UTC)
- Slugs: Unique, lowercase URL-safe identifiers for SEO-friendly routing
- Money: Use fixed precision decimal type for prices (not float)
- Status fields: Restrict with controlled value checks (or enum type in implementation)
- Soft delete: Not included in this phase; can be added later via `deleted_at`

## 4) Table Definitions

## 4.1 `profiles`
Stores user profile and authorization-related role.

| Field | Type (Suggested) | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, FK -> auth.users.id, NOT NULL | 1:1 with Supabase auth user |
| full_name | text | NOT NULL, length check | Customer/admin display name |
| phone | text | NULL, optional format check | International format recommended |
| address | text | NULL | Default shipping/billing address |
| role | text | NOT NULL, CHECK role IN ('customer','administrator'), DEFAULT 'customer' | Authorization role |
| avatar_url | text | NULL | Public URL in `avatars` bucket |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Profile creation timestamp |

Unique and index recommendations:
- PK index on `id`
- Optional index on `role` for admin queries

## 4.2 `categories`
Classifies products for browsing and filtering.

| Field | Type (Suggested) | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, NOT NULL | Category identifier |
| name | text | NOT NULL, UNIQUE | Example: Sourdough Bread |
| description | text | NULL | Category description |
| image_url | text | NULL | Category visual asset |

Seed examples:
- Sourdough Bread
- Pastries
- Sweet Treats
- Seasonal

Unique and index recommendations:
- Unique index on `name`

## 4.3 `products`
Represents sellable catalog items.

| Field | Type (Suggested) | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, NOT NULL | Product identifier |
| category_id | uuid | FK -> categories.id, NOT NULL, ON UPDATE CASCADE, ON DELETE RESTRICT | Belongs to one category |
| name | text | NOT NULL | Product name |
| slug | text | NOT NULL, UNIQUE | URL path key |
| description | text | NULL | Marketing and product details |
| ingredients | text | NULL | Ingredient list (text for current scope) |
| weight | numeric(8,2) | NULL, CHECK weight > 0 | Weight in grams or kilograms (unit convention required) |
| price | numeric(10,2) | NOT NULL, CHECK price >= 0 | Product unit price |
| image_url | text | NULL | Main image URL in `products` bucket |
| is_featured | boolean | NOT NULL, DEFAULT false | Homepage highlighting |
| in_stock | boolean | NOT NULL, DEFAULT true | Availability toggle |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Product creation timestamp |

Indexes:
- Unique index on `slug`
- Index on `category_id`
- Index on `is_featured`
- Optional partial index for in-stock products

## 4.4 `recipes`
Stores educational/marketing recipe content.

| Field | Type (Suggested) | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, NOT NULL | Recipe identifier |
| title | text | NOT NULL | Recipe title |
| slug | text | NOT NULL, UNIQUE | URL path key |
| description | text | NULL | Short intro |
| content | text | NOT NULL | Full recipe body |
| image_url | text | NULL | Recipe image URL in `recipes` bucket |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Publish/create timestamp |

Indexes:
- Unique index on `slug`

## 4.5 `articles`
Stores long-form educational and promotional content.

| Field | Type (Suggested) | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, NOT NULL | Article identifier |
| title | text | NOT NULL | Article title |
| slug | text | NOT NULL, UNIQUE | URL path key |
| summary | text | NULL | Preview text |
| content | text | NOT NULL | Full article body |
| image_url | text | NULL | Article image URL in `articles` bucket |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Publish/create timestamp |

Indexes:
- Unique index on `slug`

## 4.6 `orders`
Stores customer order headers.

| Field | Type (Suggested) | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, NOT NULL | Order identifier |
| user_id | uuid | FK -> profiles.id, NOT NULL, ON UPDATE CASCADE, ON DELETE RESTRICT | Order owner |
| total_price | numeric(10,2) | NOT NULL, CHECK total_price >= 0 | Order grand total snapshot |
| status | text | NOT NULL, CHECK status IN ('pending','confirmed','preparing','shipped','delivered','cancelled'), DEFAULT 'pending' | Order lifecycle state |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Order creation timestamp |

Indexes:
- Index on `user_id`
- Index on `status`
- Index on `created_at` (descending for history views)

## 4.7 `order_items`
Stores line items belonging to an order.

| Field | Type (Suggested) | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, NOT NULL | Line item identifier |
| order_id | uuid | FK -> orders.id, NOT NULL, ON UPDATE CASCADE, ON DELETE CASCADE | Parent order |
| product_id | uuid | FK -> products.id, NOT NULL, ON UPDATE CASCADE, ON DELETE RESTRICT | Purchased product reference |
| quantity | integer | NOT NULL, CHECK quantity > 0 | Quantity purchased |
| unit_price | numeric(10,2) | NOT NULL, CHECK unit_price >= 0 | Product unit price snapshot at order time |

Recommended integrity and indexes:
- Unique constraint on (`order_id`, `product_id`) to prevent duplicate product lines per order
- Index on `order_id`
- Index on `product_id`

## 5) Normalization Notes
Current design aligns with Third Normal Form (3NF) for the requested scope:
- Entities are separated by domain responsibility (`products`, `recipes`, `articles`, `orders`)
- Repeating groups are extracted (`order_items` separate from `orders`)
- Non-key attributes depend on the key of their own table
- Transaction snapshots are preserved (`order_items.unit_price` and `orders.total_price`) to keep historical correctness

Potential future normalization (optional):
- Move `ingredients` into `product_ingredients` table if ingredient-level filtering or allergen analytics is needed
- Move address into dedicated `addresses` table for multi-address checkout

## 6) Relationships

## 6.1 Relationship Summary
| Parent Table | Child Table | Cardinality | Relationship Type |
|---|---|---|---|
| categories | products | 1 -> many | One category has many products |
| profiles | orders | 1 -> many | One user profile has many orders |
| orders | order_items | 1 -> many | One order has many line items |
| products | order_items | 1 -> many | One product can appear in many order items |
| products | categories | many -> 1 | Many products belong to one category |
| orders | profiles | many -> 1 | Many orders belong to one user |
| order_items | orders | many -> 1 | Many order items belong to one order |
| order_items | products | many -> 1 | Many order items reference one product |

## 6.2 ER Diagram (Text Representation)
```mermaid
erDiagram
    PROFILES ||--o{ ORDERS : places
    CATEGORIES ||--o{ PRODUCTS : contains
    ORDERS ||--o{ ORDER_ITEMS : includes
    PRODUCTS ||--o{ ORDER_ITEMS : purchased_as

    PROFILES {
        uuid id PK
        text full_name
        text phone
        text address
        text role
        text avatar_url
        timestamptz created_at
    }

    CATEGORIES {
        uuid id PK
        text name UNIQUE
        text description
        text image_url
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        text name
        text slug UNIQUE
        text description
        text ingredients
        numeric weight
        numeric price
        text image_url
        boolean is_featured
        boolean in_stock
        timestamptz created_at
    }

    RECIPES {
        uuid id PK
        text title
        text slug UNIQUE
        text description
        text content
        text image_url
        timestamptz created_at
    }

    ARTICLES {
        uuid id PK
        text title
        text slug UNIQUE
        text summary
        text content
        text image_url
        timestamptz created_at
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        numeric total_price
        text status
        timestamptz created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        integer quantity
        numeric unit_price
    }
```

## 7) Row Level Security (RLS) Strategy

RLS should be enabled on all public schema tables listed below.
Policy design is based on role in `profiles.role` and owner checks with `auth.uid()`.

## 7.1 Policy Principles
- Guests can read only publicly visible catalog/content data
- Customers can manage only their own profile and own orders
- Administrators can manage all business entities
- Write operations are explicitly restricted and minimal by default

## 7.2 Policy Matrix

| Table | Guest (unauthenticated) | Customer (authenticated) | Administrator |
|---|---|---|---|
| profiles | No direct read/write by default | Select/update own profile only (`id = auth.uid()`) | Full select/update on all profiles |
| products | Read allowed | Read allowed | Full CRUD |
| recipes | Read allowed | Read allowed | Full CRUD |
| articles | Read allowed | Read allowed | Full CRUD |
| orders | No access | Select own orders; insert own orders; update limited fields only when business allows | Full CRUD |
| order_items | No access | Select/insert rows only for own orders (via parent order ownership check) | Full CRUD |

## 7.3 Per-Table RLS Recommendations

### `profiles`
- `SELECT`: allow owner (`id = auth.uid()`) and admins
- `INSERT`: allow authenticated user to create own profile (`id = auth.uid()`)
- `UPDATE`: allow owner updates for non-privileged fields; role change only by admin
- `DELETE`: admin only (or disallow hard delete globally)

### `products`, `recipes`, `articles`
- `SELECT`: allow all (`true`) for public visibility
- `INSERT`, `UPDATE`, `DELETE`: admin only

### `orders`
- `SELECT`: owner (`user_id = auth.uid()`) or admin
- `INSERT`: authenticated user can create where `user_id = auth.uid()`
- `UPDATE`: customer cannot freely edit order after placement except optional limited status transitions (example: cancel while pending); admins can fully update
- `DELETE`: admin only (or prohibit and use status workflow)

### `order_items`
- `SELECT`: rows tied to orders owned by `auth.uid()` or admin
- `INSERT`: allow only if referenced `order_id` belongs to `auth.uid()`
- `UPDATE`: generally admin only to preserve order integrity
- `DELETE`: generally admin only to preserve auditability

## 7.4 Security Notes
- Avoid exposing `profiles.role` editing to non-admin users
- Prefer database-side checks for ownership in each policy (`EXISTS` subquery to parent `orders`)
- Consider read-only database views for public product cards to reduce exposed columns

## 8) Supabase Storage Strategy

Use separate buckets by domain to isolate lifecycle, permissions, and caching.

## 8.1 Buckets
| Bucket | Purpose | Typical File Types |
|---|---|---|
| products | Product images | jpg, png, webp |
| recipes | Recipe images/media | jpg, png, webp |
| articles | Article cover/media assets | jpg, png, webp |
| avatars | User profile pictures | jpg, png, webp |

## 8.2 Path Conventions
Recommended object paths:
- `products/{product_id}/{filename}`
- `recipes/{recipe_id}/{filename}`
- `articles/{article_id}/{filename}`
- `avatars/{user_id}/{filename}`

Benefits:
- Natural ownership mapping
- Easier cleanup and versioning
- Predictable CDN/cache invalidation patterns

## 8.3 Storage Access Model
- `products`, `recipes`, `articles` buckets:
  - Public read
  - Admin-only upload/update/delete
- `avatars` bucket:
  - Public read optional (or signed URLs for privacy)
  - Authenticated user can upload/update only under own user folder
  - Admin can moderate/delete any avatar

## 8.4 Storage Validation Rules (Recommended)
- Max file size per object (example: 2-5 MB)
- Allowed MIME types restricted to image formats
- Optional image dimension constraints enforced in upload workflow
- Filename sanitization and collision-resistant naming

## 9) Implementation Readiness Checklist
- All required tables are defined with keys and constraints
- Relationships and cardinalities are explicit
- URL slug uniqueness is planned for routable entities
- Money and quantity fields use safe numeric constraints
- RLS strategy is defined per table and per role
- Storage bucket strategy aligns with content domains and ownership

This schema is ready to be used as the blueprint for Supabase migration and policy implementation in the next phase.
