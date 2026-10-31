-- FileMorph grants + Row Level Security.
-- Principle: clients can only READ their own rows. Every mutation runs
-- server-side through the service role or SECURITY DEFINER functions.

alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.files enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.job_files enable row level security;
alter table public.usage_records enable row level security;
alter table public.payment_events enable row level security;
alter table public.user_preferences enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Grants (explicit, minimal)
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.plans to anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.files to authenticated;
grant select on public.processing_jobs to authenticated;
grant select on public.job_files to authenticated;
grant select on public.usage_records to authenticated;
grant select on public.user_preferences to authenticated;

grant select, insert on public.support_tickets to authenticated;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- plans: world-readable
drop policy if exists "plans_read" on public.plans;
create policy "plans_read" on public.plans for select using (true);

-- profiles: self read
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select using (auth.uid() = id);

-- subscriptions: self read only (mutations are server-side)
drop policy if exists "subscriptions_self_read" on public.subscriptions;
create policy "subscriptions_self_read" on public.subscriptions for select
  using (auth.uid() = user_id);

-- files: owner read + delete (owner)
drop policy if exists "files_self_read" on public.files;
create policy "files_self_read" on public.files for select
  using (auth.uid() = user_id);
drop policy if exists "files_self_delete" on public.files;
create policy "files_self_delete" on public.files for delete
  using (auth.uid() = user_id);

-- jobs: owner read (mutations via functions/service role)
drop policy if exists "jobs_self_read" on public.processing_jobs;
create policy "jobs_self_read" on public.processing_jobs for select
  using (auth.uid() = user_id);

-- job_files: readable to job owner
drop policy if exists "job_files_read" on public.job_files;
create policy "job_files_read" on public.job_files for select
  using (exists (
    select 1 from public.processing_jobs j
    where j.id = job_id and j.user_id = auth.uid()
  ));

-- usage: self read
drop policy if exists "usage_self_read" on public.usage_records;
create policy "usage_self_read" on public.usage_records for select
  using (auth.uid() = user_id);

-- preferences: self read
drop policy if exists "prefs_self_read" on public.user_preferences;
create policy "prefs_self_read" on public.user_preferences for select
  using (auth.uid() = user_id);

-- support tickets: user can create own ticket and read own
drop policy if exists "tickets_self_insert" on public.support_tickets;
create policy "tickets_self_insert" on public.support_tickets for insert
  with check (auth.uid() = user_id);
drop policy if exists "tickets_self_read" on public.support_tickets;
create policy "tickets_self_read" on public.support_tickets for select
  using (auth.uid() = user_id);

-- payment events / audit logs: not client-accessible by design.
