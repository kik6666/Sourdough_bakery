-- =========================================================
-- Initial schema migration for Sourdough Bakery
-- Source of truth:
--   - docs/information-architecture.md
--   - docs/database-schema.md
-- =========================================================

begin;

-- =========================================================
-- Extensions
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- Helper functions
-- =========================================================

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- Tables
-- =========================================================

-- 1) profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on update cascade on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  phone text,
  address text,
  role text not null default 'customer' check (role in ('customer', 'administrator')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on update cascade on delete restrict,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  ingredients text,
  weight numeric(8,2) check (weight is null or weight > 0),
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_featured boolean not null default false,
  in_stock boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) recipes
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on update cascade on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on update cascade on delete set null,
  title text not null,
  slug text not null unique,
  summary text,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on update cascade on delete restrict,
  total_price numeric(10,2) not null check (total_price >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  delivery_method text not null default 'pickup' check (delivery_method in ('pickup', 'delivery')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7) order_items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on update cascade on delete cascade,
  product_id uuid not null references public.products(id) on update cascade on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, product_id)
);

-- =========================================================
-- Post-table helper functions
-- =========================================================

-- Helper function used by RLS policies
-- SECURITY DEFINER is used so role checks can be resolved consistently.
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'administrator'
  );
$$;

-- =========================================================
-- Indexes
-- =========================================================

create index if not exists idx_profiles_role on public.profiles(role);

create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_is_featured on public.products(is_featured);
create index if not exists idx_products_in_stock on public.products(in_stock) where in_stock = true;
create index if not exists idx_products_is_active on public.products(is_active) where is_active = true;

create index if not exists idx_recipes_created_by on public.recipes(created_by);
create index if not exists idx_articles_created_by on public.articles(created_by);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_delivery_method on public.orders(delivery_method);
create index if not exists idx_orders_created_at_desc on public.orders(created_at desc);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- =========================================================
-- Triggers
-- =========================================================

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_categories_set_updated_at on public.categories;
create trigger trg_categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_recipes_set_updated_at on public.recipes;
create trigger trg_recipes_set_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_articles_set_updated_at on public.articles;
create trigger trg_articles_set_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_set_updated_at on public.orders;
create trigger trg_orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_order_items_set_updated_at on public.order_items;
create trigger trg_order_items_set_updated_at
before update on public.order_items
for each row
execute function public.set_updated_at();

-- Auto-create a customer profile after successful auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'New User'),
    'customer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================================================
-- Grants (RLS will enforce row-level access)
-- =========================================================

grant usage on schema public to anon, authenticated;
grant usage on schema public to service_role;

grant select on public.categories, public.products, public.recipes, public.articles to anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.recipes to authenticated;
grant select, insert, update, delete on public.articles to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;

-- Service role is used by server-side scripts (for example, seeding).
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.categories to service_role;
grant select, insert, update, delete on public.products to service_role;
grant select, insert, update, delete on public.recipes to service_role;
grant select, insert, update, delete on public.articles to service_role;
grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.order_items to service_role;

-- =========================================================
-- Row Level Security enablement
-- =========================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.recipes enable row level security;
alter table public.articles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- =========================================================
-- RLS policies: profiles
-- =========================================================

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_own_or_admin on public.profiles;
create policy profiles_insert_own_or_admin
on public.profiles
for insert
to authenticated
with check ((id = auth.uid() and role = 'customer') or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check ((id = auth.uid() and role = 'customer') or public.is_admin());

drop policy if exists profiles_delete_admin_only on public.profiles;
create policy profiles_delete_admin_only
on public.profiles
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- RLS policies: categories (public read, admin write)
-- =========================================================

drop policy if exists categories_select_public on public.categories;
create policy categories_select_public
on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists categories_insert_admin_only on public.categories;
create policy categories_insert_admin_only
on public.categories
for insert
to authenticated
with check (public.is_admin());

drop policy if exists categories_update_admin_only on public.categories;
create policy categories_update_admin_only
on public.categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists categories_delete_admin_only on public.categories;
create policy categories_delete_admin_only
on public.categories
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- RLS policies: products (public read, admin write)
-- =========================================================

drop policy if exists products_select_public on public.products;
create policy products_select_public
on public.products
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists products_insert_admin_only on public.products;
create policy products_insert_admin_only
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists products_update_admin_only on public.products;
create policy products_update_admin_only
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists products_delete_admin_only on public.products;
create policy products_delete_admin_only
on public.products
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- RLS policies: recipes (public read, admin write)
-- =========================================================

drop policy if exists recipes_select_public on public.recipes;
create policy recipes_select_public
on public.recipes
for select
to anon, authenticated
using (true);

drop policy if exists recipes_insert_admin_only on public.recipes;
create policy recipes_insert_admin_only
on public.recipes
for insert
to authenticated
with check (public.is_admin());

drop policy if exists recipes_update_admin_only on public.recipes;
create policy recipes_update_admin_only
on public.recipes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists recipes_delete_admin_only on public.recipes;
create policy recipes_delete_admin_only
on public.recipes
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- RLS policies: articles (public read, admin write)
-- =========================================================

drop policy if exists articles_select_public on public.articles;
create policy articles_select_public
on public.articles
for select
to anon, authenticated
using (true);

drop policy if exists articles_insert_admin_only on public.articles;
create policy articles_insert_admin_only
on public.articles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists articles_update_admin_only on public.articles;
create policy articles_update_admin_only
on public.articles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists articles_delete_admin_only on public.articles;
create policy articles_delete_admin_only
on public.articles
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- RLS policies: orders (own read/create, admin full)
-- =========================================================

drop policy if exists orders_select_own_or_admin on public.orders;
create policy orders_select_own_or_admin
on public.orders
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists orders_insert_own_or_admin on public.orders;
create policy orders_insert_own_or_admin
on public.orders
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists orders_update_admin_only on public.orders;
create policy orders_update_admin_only
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists orders_delete_admin_only on public.orders;
create policy orders_delete_admin_only
on public.orders
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- RLS policies: order_items (own order read/create, admin full)
-- =========================================================

drop policy if exists order_items_select_own_or_admin on public.order_items;
create policy order_items_select_own_or_admin
on public.order_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists order_items_insert_own_or_admin on public.order_items;
create policy order_items_insert_own_or_admin
on public.order_items
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists order_items_update_admin_only on public.order_items;
create policy order_items_update_admin_only
on public.order_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists order_items_delete_admin_only on public.order_items;
create policy order_items_delete_admin_only
on public.order_items
for delete
to authenticated
using (public.is_admin());

-- =========================================================
-- Supabase Storage buckets
-- =========================================================

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('recipes', 'recipes', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('articles', 'articles', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Storage policy setup can fail on some hosted roles due ownership restrictions.
-- Keep core schema migration successful even when these policy DDL statements are blocked.
do $$
begin
  -- Public read for public content buckets
  -- (products, recipes, articles)
  drop policy if exists storage_public_read_content on storage.objects;
  create policy storage_public_read_content
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id in ('products', 'recipes', 'articles'));

  -- Admin full access to all storage objects
  drop policy if exists storage_admin_full_access on storage.objects;
  create policy storage_admin_full_access
  on storage.objects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

  -- Avatar read: owner or admin
  drop policy if exists storage_avatars_select_owner_or_admin on storage.objects;
  create policy storage_avatars_select_owner_or_admin
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

  -- Avatar insert: owner folder or admin
  drop policy if exists storage_avatars_insert_owner_or_admin on storage.objects;
  create policy storage_avatars_insert_owner_or_admin
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

  -- Avatar update: owner or admin
  drop policy if exists storage_avatars_update_owner_or_admin on storage.objects;
  create policy storage_avatars_update_owner_or_admin
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'avatars'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

  -- Avatar delete: owner or admin
  drop policy if exists storage_avatars_delete_owner_or_admin on storage.objects;
  create policy storage_avatars_delete_owner_or_admin
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
exception
  when insufficient_privilege then
    raise notice 'Skipping storage policy setup due to insufficient privilege on storage.objects. Configure policies in Storage -> Policies if needed.';
end;
$$;

commit;
