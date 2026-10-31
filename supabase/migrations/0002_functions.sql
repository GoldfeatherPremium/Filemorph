-- FileMorph server-side functions (SECURITY DEFINER).
-- Clients must never mutate subscriptions, job status, usage counters, or
-- payment records directly. All privileged mutations flow through these
-- trusted functions or the service role.

-- ---------------------------------------------------------------------------
-- Auto-create profile + preferences when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan_code, last_login_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null),
    'free',
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        last_login_at = now();

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Profile update (only allowed columns)
-- ---------------------------------------------------------------------------
create or replace function public.update_profile(
  p_full_name text default null,
  p_avatar_url text default null
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles;
begin
  update public.profiles
     set full_name = coalesce(p_full_name, full_name),
         avatar_url = coalesce(p_avatar_url, avatar_url)
   where id = auth.uid()
   returning * into v_profile;

  if v_profile.id is null then
    raise exception 'forbidden';
  end if;

  return v_profile;
end $$;

create or replace function public.update_preferences(
  p_theme text default null,
  p_marketing_opt_in boolean default null,
  p_notify_job_completion boolean default null,
  p_notify_product_updates boolean default null
) returns public.user_preferences
language plpgsql security definer set search_path = public as $$
declare
  v_prefs public.user_preferences;
begin
  update public.user_preferences
     set theme = coalesce(p_theme, theme),
         marketing_opt_in = coalesce(p_marketing_opt_in, marketing_opt_in),
         notify_job_completion = coalesce(p_notify_job_completion, notify_job_completion),
         notify_product_updates = coalesce(p_notify_product_updates, notify_product_updates)
   where user_id = auth.uid()
   returning * into v_prefs;

  if v_prefs.user_id is null then
    raise exception 'forbidden';
  end if;

  return v_prefs;
end $$;

-- ---------------------------------------------------------------------------
-- Atomic usage reservation + entitlement check
--
-- Returns ok=false + reason when over quota, suspended, or plan inactive.
-- On success inserts a usage record (reservation), so a job can never be
-- double-created against the same quota.
-- ---------------------------------------------------------------------------
create or replace function public.reserve_job(
  p_user_id uuid,
  p_owner_token text,
  p_job_id uuid,
  p_tool_code text,
  p_bytes bigint
) returns table (ok boolean, reason text, quota_monthly int, quota_daily int, used_monthly int, used_daily int)
language plpgsql security definer set search_path = public as $$
declare
  v_plan public.plans;
  v_used_monthly int := 0;
  v_used_daily int := 0;
begin
  if p_user_id is null then
    -- Guest path: fixed daily allowance.
    select count(*) into v_used_daily
      from public.usage_records
     where owner_token = p_owner_token
       and created_at >= date_trunc('day', now());
    if v_used_daily >= 3 then
      return query select false, 'daily_limit', null, 3, v_used_monthly, v_used_daily;
      return;
    end if;
  else
    select pl.* into v_plan
      from public.profiles pr
      join public.plans pl on pl.code = pr.plan_code
     where pr.id = p_user_id;

    if v_plan.id is null or v_plan.is_active = false then
      return query select false, 'no_plan', null, null, 0, 0;
      return;
    end if;

    if exists (select 1 from public.profiles where id = p_user_id and suspended) then
      return query select false, 'suspended', null, null, 0, 0;
      return;
    end if;

    select count(*) into v_used_monthly
      from public.usage_records
     where user_id = p_user_id
       and created_at >= date_trunc('month', now());

    select count(*) into v_used_daily
      from public.usage_records
     where user_id = p_user_id
       and created_at >= date_trunc('day', now());

    if v_plan.monthly_job_quota is not null and v_used_monthly >= v_plan.monthly_job_quota then
      return query select false, 'monthly_limit', v_plan.monthly_job_quota, v_plan.daily_job_quota, v_used_monthly, v_used_daily;
      return;
    end if;

    if v_plan.daily_job_quota is not null and v_used_daily >= v_plan.daily_job_quota then
      return query select false, 'daily_limit', v_plan.monthly_job_quota, v_plan.daily_job_quota, v_used_monthly, v_used_daily;
      return;
    end if;
  end if;

  insert into public.usage_records (user_id, owner_token, job_id, tool_code, bytes_processed, credits_used)
  values (p_user_id, p_owner_token, p_job_id, p_tool_code, p_bytes, 1);

  return query select true, 'ok', null, null, v_used_monthly, v_used_daily;
end $$;

-- ---------------------------------------------------------------------------
-- Job status transitions (trusted only)
-- ---------------------------------------------------------------------------
create or replace function public.set_job_status(
  p_job_id uuid,
  p_status text,
  p_error_code text default null,
  p_error_message text default null
) returns public.processing_jobs
language plpgsql security definer set search_path = public as $$
declare
  v_job public.processing_jobs;
begin
  update public.processing_jobs
     set status = p_status,
         error_code = coalesce(p_error_code, error_code),
         error_message = coalesce(p_error_message, error_message),
         started_at = case when p_status in ('processing') then coalesce(started_at, now()) else started_at end,
         completed_at = case when p_status in ('completed','failed','cancelled') then now() else null end,
         cancelled_at = case when p_status = 'cancelled' then now() else null end
   where id = p_job_id
   returning * into v_job;

  return v_job;
end $$;
