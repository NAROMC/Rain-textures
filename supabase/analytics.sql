-- Run this script in Supabase SQL Editor.
-- Visitor tokens are random browser-local UUIDs, not names, emails, or IP addresses.

create table if not exists public.texture_download_counts (
  texture_id text primary key,
  download_count bigint not null default 0 check (download_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.texture_download_counts enable row level security;
drop policy if exists "Anyone can read download counts" on public.texture_download_counts;
create policy "Anyone can read download counts"
  on public.texture_download_counts for select to anon, authenticated using (true);
-- No direct insert/update/delete policies: writes are only via the RPC below.

create or replace function public.record_texture_download(p_texture_id text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare new_count bigint;
begin
  if p_texture_id is null or length(p_texture_id) = 0 or length(p_texture_id) > 200 then
    raise exception 'Invalid texture id';
  end if;
  insert into public.texture_download_counts(texture_id, download_count, updated_at)
  values (p_texture_id, 1, now())
  on conflict (texture_id) do update
    set download_count = public.texture_download_counts.download_count + 1,
        updated_at = now()
  returning download_count into new_count;
  return new_count;
end;
$$;
revoke all on function public.record_texture_download(text) from public;
grant execute on function public.record_texture_download(text) to anon, authenticated;

create table if not exists public.site_visitor_last_seen (
  visitor_id uuid primary key,
  last_counted_at timestamptz not null default now()
);
create table if not exists public.site_visit_events (
  id bigint generated always as identity primary key,
  counted_at timestamptz not null default now()
);

alter table public.site_visitor_last_seen enable row level security;
alter table public.site_visit_events enable row level security;
-- Intentionally no public policies for either visitor table. They are inaccessible
-- directly to anon/authenticated clients; SECURITY DEFINER RPCs mediate access.

create or replace function public.record_unique_site_visit(p_visitor_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare previous_seen timestamptz;
begin
  if p_visitor_id is null then return false; end if;
  -- Serialize concurrent requests for the same token to avoid double counting.
  perform pg_advisory_xact_lock(hashtextextended(p_visitor_id::text, 0));
  select last_counted_at into previous_seen
    from public.site_visitor_last_seen
    where visitor_id = p_visitor_id;

  if previous_seen is null then
    insert into public.site_visitor_last_seen(visitor_id, last_counted_at)
      values (p_visitor_id, now()) on conflict (visitor_id) do nothing;
    insert into public.site_visit_events(counted_at) values (now());
    return true;
  elsif previous_seen <= now() - interval '24 hours' then
    update public.site_visitor_last_seen
      set last_counted_at = now()
      where visitor_id = p_visitor_id;
    insert into public.site_visit_events(counted_at) values (now());
    return true;
  end if;
  return false;
end;
$$;
revoke all on function public.record_unique_site_visit(uuid) from public;
grant execute on function public.record_unique_site_visit(uuid) to anon, authenticated;

create or replace function public.get_admin_unique_visit_count()
returns bigint
language plpgsql
security definer
stable
set search_path = ''
as $$
declare total bigint;
begin
  if (select auth.uid()) is distinct from 'cea7a536-4264-4c2f-b6f5-a03a51163e1c'::uuid then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select count(*) into total from public.site_visit_events;
  return coalesce(total, 0);
end;
$$;
revoke all on function public.get_admin_unique_visit_count() from public;
grant execute on function public.get_admin_unique_visit_count() to authenticated;

-- Make sure no anon/authenticated role has table-level privileges that bypass RLS.
revoke all on public.site_visitor_last_seen from anon, authenticated;
revoke all on public.site_visit_events from anon, authenticated;
revoke insert, update, delete on public.texture_download_counts from anon, authenticated;
grant select on public.texture_download_counts to anon, authenticated;
