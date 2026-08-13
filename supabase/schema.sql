-- Moliya database schema
-- Run this entire file in Supabase Dashboard > SQL Editor once.

create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete restrict,
  sale_date date not null default current_date,
  cash_amount numeric(16,2) not null default 0 check (cash_amount >= 0),
  card_amount numeric(16,2) not null default 0 check (card_amount >= 0),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cash_amount + card_amount > 0)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete restrict,
  expense_date date not null default current_date,
  amount numeric(16,2) not null check (amount > 0),
  category text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete restrict,
  full_name text not null,
  role text not null,
  phone text not null default '',
  monthly_salary numeric(16,2) not null check (monthly_salary > 0),
  hired_at date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  shop_id uuid not null references public.shops(id) on delete restrict,
  payment_date date not null default current_date,
  salary_month text not null check (salary_month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount numeric(16,2) not null check (amount > 0),
  payment_type text not null check (payment_type in ('advance', 'salary', 'bonus', 'deduction')),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_shop_date_idx on public.sales(shop_id, sale_date desc);
create index if not exists expenses_shop_date_idx on public.expenses(shop_id, expense_date desc);
create index if not exists employees_shop_active_idx on public.employees(shop_id, is_active);
create index if not exists salary_payments_shop_month_idx on public.salary_payments(shop_id, salary_month);
create index if not exists salary_payments_employee_idx on public.salary_payments(employee_id, payment_date desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shops_updated_at on public.shops;
create trigger shops_updated_at before update on public.shops for each row execute function public.set_updated_at();
drop trigger if exists sales_updated_at on public.sales;
create trigger sales_updated_at before update on public.sales for each row execute function public.set_updated_at();
drop trigger if exists expenses_updated_at on public.expenses;
create trigger expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at before update on public.employees for each row execute function public.set_updated_at();
drop trigger if exists salary_payments_updated_at on public.salary_payments;
create trigger salary_payments_updated_at before update on public.salary_payments for each row execute function public.set_updated_at();

-- The browser never talks to these tables directly. Only the server-side service key does.
alter table public.shops enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.employees enable row level security;
alter table public.salary_payments enable row level security;

-- Initial two stores; rename them from the web app after setup.
insert into public.shops (name, address)
select '1-do‘kon', ''
where not exists (select 1 from public.shops);

insert into public.shops (name, address)
select '2-do‘kon', ''
where (select count(*) from public.shops) = 1;
