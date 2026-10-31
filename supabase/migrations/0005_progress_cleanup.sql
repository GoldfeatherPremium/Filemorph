-- FileMorph: job progress tracking + cleanup helpers.

alter table public.processing_jobs
  add column if not exists progress_pct int not null default 0,
  add column if not exists stage text;

create index if not exists jobs_progress_idx on public.processing_jobs(status, updated_at) where status in ('queued','processing');

-- Archive/delete expired jobs (retention). Called by the cleanup worker.
create or replace function public.cleanup_expired()
returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Expire jobs beyond retention (and their outputs).
  update public.processing_jobs
     set status = 'expired',
         expires_at = now(),
         updated_at = now()
   where status in ('queued','processing')
     and expires_at is not null
     and expires_at < now();

  -- Mark expired files.
  update public.files
     set status = 'expired',
         updated_at = now()
   where status in ('ready','processing')
     and expires_at is not null
     and expires_at < now();
end $$;
