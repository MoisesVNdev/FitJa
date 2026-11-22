-- Execute with Supabase migrations. Never expose the service role key to the browser.
create extension if not exists pgcrypto;
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
create policy "read own membership" on public.admins for select to authenticated using (user_id = auth.uid());
grant select on public.admins to authenticated;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.catalog_state (
  id text primary key check (id in ('published','draft','previous')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.catalog_state enable row level security;
create policy "published catalog or administrator" on public.catalog_state for select to anon, authenticated using (id = 'published' or public.is_admin());
grant select on public.catalog_state to anon, authenticated;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('requested','confirmed','completed','cancelled')),
  source text not null check (source in ('site','counter','whatsapp')),
  notes text not null default '' check (length(notes) <= 500),
  original jsonb not null, current jsonb not null,
  adjustment integer not null default 0 check (adjustment between -1000000 and 1000000),
  adjustment_reason text not null default '' check (length(adjustment_reason) <= 500),
  idempotency_key uuid unique, payload_hash text,
  check ((current->>'total')::bigint + adjustment >= 0),
  check ((status = 'completed') = (completed_at is not null))
);
create index orders_created on public.orders(created_at desc);
create index orders_completed on public.orders(completed_at desc) where status='completed';
alter table public.orders enable row level security;
create policy "administrator order reads" on public.orders for select to authenticated using (public.is_admin());
grant select on public.orders to authenticated;

create table public.order_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid, created_at timestamptz not null default now(),
  before_data jsonb, after_data jsonb not null
);
alter table public.order_history enable row level security;
create policy "administrator history reads" on public.order_history for select to authenticated using (public.is_admin());
grant select on public.order_history to authenticated;
create function public.audit_order() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.order_history(order_id, actor_id, before_data, after_data)
  values(new.id, nullif(current_setting('app.actor',true),'')::uuid,
    case when TG_OP = 'UPDATE' then to_jsonb(old) - 'payload_hash' - 'idempotency_key' else null end,
    to_jsonb(new) - 'payload_hash' - 'idempotency_key');
  return new;
end $$;
-- History is written AFTER the row exists. Immutable snapshot is enforced separately.
create function public.protect_order() returns trigger language plpgsql set search_path='' as $$
begin
  new.original:=old.original; new.created_at:=old.created_at; new.reference:=old.reference;
  new.source:=old.source; new.idempotency_key:=old.idempotency_key; new.payload_hash:=old.payload_hash;
  new.updated_at:=clock_timestamp(); return new;
end $$;
create trigger protect_order before update on public.orders for each row execute function public.protect_order();
create trigger audit_order after insert or update on public.orders for each row execute function public.audit_order();

create table public.events (
  id bigint generated always as identity primary key,
  name text not null check (name in ('visit','product_view','add_to_cart','whatsapp_click','instagram_click','request_created')),
  product_id text check (length(product_id) <= 80), session_id uuid not null,
  created_at timestamptz not null default now()
);
create index events_created on public.events(created_at desc);
alter table public.events enable row level security;
create policy "administrator analytics reads" on public.events for select to authenticated using (public.is_admin());
grant select on public.events to authenticated;

create table public.rate_limits (key text primary key, window_start timestamptz not null, count integer not null);
alter table public.rate_limits enable row level security;
create function public.consume_rate(bucket text, maximum integer) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
  insert into public.rate_limits as r(key,window_start,count) values(bucket,date_trunc('minute',now()),1)
  on conflict(key) do update set count=case when r.window_start=date_trunc('minute',now()) then r.count+1 else 1 end,window_start=date_trunc('minute',now()) returning count into n;
  return n<=maximum;
end $$;
revoke all on function public.consume_rate(text,integer) from public,anon,authenticated;
grant execute on function public.consume_rate(text,integer) to service_role;

create function public.publish_catalog(document jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(68231010);
  insert into public.catalog_state(id,data) select 'previous',data from public.catalog_state where id='published'
    on conflict(id) do update set data=excluded.data,updated_at=now();
  insert into public.catalog_state(id,data) values('published',document),('draft',document)
    on conflict(id) do update set data=excluded.data,updated_at=now();
end $$;
revoke all on function public.publish_catalog(jsonb) from public,anon,authenticated;
grant execute on function public.publish_catalog(jsonb) to service_role;

create function public.write_order(document jsonb, actor uuid, expected_updated timestamptz default null) returns public.orders language plpgsql security definer set search_path='' as $$
declare result public.orders;
begin
  perform set_config('app.actor',coalesce(actor::text,''),true);
  if document ? 'id' then
    update public.orders set current=document->'current',status=document->>'status',notes=document->>'notes',
      adjustment=(document->>'adjustment')::integer,adjustment_reason=document->>'adjustment_reason',
      completed_at=case when document->>'status'='completed' then coalesce(completed_at,now()) else null end
    where id=(document->>'id')::uuid and updated_at=expected_updated returning * into result;
    if not found then raise exception 'Pedido atualizado em outra janela. Recarregue antes de salvar.'; end if;
  else
    insert into public.orders(reference,status,source,notes,original,current,adjustment,adjustment_reason,completed_at,idempotency_key,payload_hash)
    values(document->>'reference',document->>'status',document->>'source',document->>'notes',document->'original',document->'current',
      (document->>'adjustment')::integer,document->>'adjustment_reason',case when document->>'status'='completed' then now() else null end,
      (document->>'idempotency_key')::uuid,document->>'payload_hash')
    on conflict(idempotency_key) do nothing returning * into result;
    if not found then
      select * into result from public.orders where idempotency_key=(document->>'idempotency_key')::uuid;
      if result.payload_hash is distinct from document->>'payload_hash' then raise exception 'Referência já utilizada com outro pedido.'; end if;
    end if;
  end if;
  return result;
end $$;
revoke all on function public.write_order(jsonb,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.write_order(jsonb,uuid,timestamptz) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('menu-images','menu-images',true,5242880,array['image/jpeg','image/webp']) on conflict(id) do nothing;
create policy "menu images public reads" on storage.objects for select to anon,authenticated using(bucket_id='menu-images');
create policy "admin image upload" on storage.objects for insert to authenticated with check(bucket_id='menu-images' and public.is_admin());
create policy "admin image delete" on storage.objects for delete to authenticated using(bucket_id='menu-images' and public.is_admin());

-- Invoke daily from the backup job, after exporting events. No personal IP is stored.
create function public.cleanup_telemetry() returns void language sql security definer set search_path='' as $$
  delete from public.events where created_at < now()-interval '90 days';
  delete from public.rate_limits where window_start < now()-interval '1 day';
$$;
revoke all on function public.cleanup_telemetry() from public,anon,authenticated;
grant execute on function public.cleanup_telemetry() to service_role;

grant usage on schema public to anon,authenticated,service_role;
grant all on public.admins,public.catalog_state,public.orders,public.order_history,public.events,public.rate_limits to service_role;
grant usage,select on all sequences in schema public to service_role;
