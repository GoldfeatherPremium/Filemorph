-- FileMorph core schema
-- PostgreSQL + Supabase. UUID PKs, FK constraints, indexes, RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('free','plus','pro')),
  name text not null,
  description text,
  price_monthly_usd numeric(10,2) not null default 0,
  price_yearly_usd numeric(10,2) not null default 0,
  monthly_job_quota int,            -- null = unlimited
  daily_job_quota int,              -- null = unlimited
  max_batch_size int not null default 1,
  max_file_bytes bigint not null default 20971520,
  batch_enabled boolean not null default false,
  advanced_compression boolean not null default false,
  priority int not null default 0,  -- higher = queued sooner
  retention_hours int not null default 24,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan_code text not null default 'free' references public.plans(code),
  is_admin boolean not null default false,
  suspended boolean not null default false,
  suspension_reason text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'paddle',
  provider_subscription_id text,
  provider_customer_id text,
  plan_code text not null references public.plans(code),
  status text not null default 'active' check (status in ('active','trialing','past_due','paused','canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  next_billed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_subscription_id)
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
create index if not exists subscriptions_provider_idx on public.subscriptions(provider_subscription_id);

-- ---------------------------------------------------------------------------
-- Files
-- ---------------------------------------------------------------------------
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  owner_token text,                  -- guest identifier (no account)
  bucket text not null default 'user-files',
  storage_path text not null unique,
  filename text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text,
  width int,
  height int,
  page_count int,
  status text not null default 'ready'
    check (status in ('ready','processing','error','expired','deleted')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or owner_token is not null)
);

create index if not exists files_user_idx on public.files(user_id, created_at desc);
create index if not exists files_token_idx on public.files(owner_token, created_at desc);
create index if not exists files_expires_idx on public.files(expires_at) where expires_at is not null;

-- ---------------------------------------------------------------------------
-- Processing jobs
-- ---------------------------------------------------------------------------
create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  owner_token text,                  -- guest identifier
  tool_code text not null,
  status text not null default 'queued'
    check (status in ('queued','processing','completed','failed','cancelled','expired')),
  queue_name text not null default 'processing',
  priority int not null default 0,
  input_total_bytes bigint not null default 0,
  output_total_bytes bigint not null default 0,
  settings jsonb not null default '{}'::jsonb,
  result jsonb,                      -- { outputs: [{storagePath,filename,contentType,sizeBytes,width,height,page}] }
  error_code text,
  error_message text,
  attempts int not null default 0,
  max_attempts int not null default 3,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or owner_token is not null)
);

create index if not exists jobs_user_idx on public.processing_jobs(user_id, created_at desc);
create index if not exists jobs_token_idx on public.processing_jobs(owner_token, created_at desc);
create index if not exists jobs_status_idx on public.processing_jobs(status, created_at);
create index if not exists jobs_expires_idx on public.processing_jobs(expires_at) where expires_at is not null;

-- ---------------------------------------------------------------------------
-- Job files (inputs and outputs)
-- ---------------------------------------------------------------------------
create table if not exists public.job_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.processing_jobs(id) on delete cascade,
  file_id uuid references public.files(id) on delete set null,
  kind text not null check (kind in ('input','output')),
  sequence int not null default 0,
  label text,
  bucket text not null default 'user-files',
  storage_path text,
  content_type text,
  size_bytes bigint,
  width int,
  height int,
  page int,
  created_at timestamptz not null default now()
);

create index if not exists job_files_job_idx on public.job_files(job_id, kind, sequence);

-- ---------------------------------------------------------------------------
-- Usage records (reservations / accounting)
-- ---------------------------------------------------------------------------
create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  owner_token text,
  job_id uuid not null references public.processing_jobs(id) on delete cascade,
  tool_code text not null,
  bytes_processed bigint not null default 0,
  credits_used int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists usage_user_idx on public.usage_records(user_id, created_at);
create index if not exists usage_token_idx on public.usage_records(owner_token, created_at);
create index if not exists usage_job_idx on public.usage_records(job_id);

-- ---------------------------------------------------------------------------
-- Payment events (idempotent webhook log)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paddle',
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received','processing','processed','failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- User preferences
-- ---------------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light','dark')),
  marketing_opt_in boolean not null default false,
  notify_job_completion boolean not null default true,
  notify_product_updates boolean not null default false,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Support tickets
-- ---------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  category text not null default 'general',
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_status_idx on public.support_tickets(status, created_at);

-- ---------------------------------------------------------------------------
-- Audit log (server-side only)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  resource text,
  resource_id text,
  ip text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_created_idx on public.audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
drop trigger if exists trg_files_updated on public.files;
create trigger trg_files_updated before update on public.files
  for each row execute function public.set_updated_at();
drop trigger if exists trg_jobs_updated on public.processing_jobs;
create trigger trg_jobs_updated before update on public.processing_jobs
  for each row execute function public.set_updated_at();
drop trigger if exists trg_prefs_updated on public.user_preferences;
create trigger trg_prefs_updated before update on public.user_preferences
  for each row execute function public.set_updated_at();
drop trigger if exists trg_tickets_updated on public.support_tickets;
create trigger trg_tickets_updated before update on public.support_tickets
  for each row execute function public.set_updated_at();
