-- Seed the three plans. Prices are initial proposed limits, editable in the
-- admin panel (plans table).

insert into public.plans (
  code, name, description,
  price_monthly_usd, price_yearly_usd,
  monthly_job_quota, daily_job_quota,
  max_batch_size, max_file_bytes,
  batch_enabled, advanced_compression, priority, retention_hours, sort_order
) values
  ('free', 'Free', 'For occasional transformations, at no cost.',
   0.00, 0.00,
   null, 10,
   1, 20971520,
   false, false, 0, 24, 1),
  ('plus', 'Plus', 'For active creators who need batches and more headroom.',
   4.99, 49.99,
   300, null,
   20, 104857600,
   true, false, 1, 168, 2),
  ('pro', 'Pro', 'For professionals who need speed, scale, and advanced control.',
   9.99, 99.99,
   1500, null,
   50, 262144000,
   true, true, 2, 720, 3)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_monthly_usd = excluded.price_monthly_usd,
  price_yearly_usd = excluded.price_yearly_usd,
  monthly_job_quota = excluded.monthly_job_quota,
  daily_job_quota = excluded.daily_job_quota,
  max_batch_size = excluded.max_batch_size,
  max_file_bytes = excluded.max_file_bytes,
  batch_enabled = excluded.batch_enabled,
  advanced_compression = excluded.advanced_compression,
  priority = excluded.priority,
  retention_hours = excluded.retention_hours,
  sort_order = excluded.sort_order;

-- Private upload bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-files', 'user-files', false, 262144000, null)
on conflict (id) do nothing;
