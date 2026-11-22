-- ============================================================
-- Multi-Service & Rental Marketplace — Migration 001
-- Jalankan di Supabase Dashboard > SQL Editor (gratis)
-- ============================================================
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------- Helper ----------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- Tables ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, username text unique, email text, phone text,
  avatar_url text, bio text, location text, date_of_birth date,
  is_adult_verified boolean not null default false,
  account_status text not null default 'active' check (account_status in ('active','suspended','banned')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('customer','provider','admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table provider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  business_name text, description text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  average_rating numeric(3,2) not null default 0,
  total_reviews integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete set null,
  name text not null, slug text not null unique, description text,
  icon text, image_url text, is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references profiles(id) on delete restrict,
  category_id uuid not null references categories(id) on delete restrict,
  title text not null, slug text not null unique, description text,
  service_type text not null check (service_type in ('service','rental')),
  pricing_unit text not null check (pricing_unit in ('per_hour','per_session','per_day','per_trip','per_item','fixed_price')),
  price numeric(14,2) not null check (price >= 0),
  location text,
  service_method text not null default 'offline' check (service_method in ('online','offline','hybrid')),
  status text not null default 'draft' check (status in ('draft','pending_review','published','rejected','archived')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on services(provider_id); create index on services(category_id);
create index on services(status, created_at desc);
create index services_title_trgm on services using gin (title gin_trgm_ops);

create table service_images (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  image_url text not null, display_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index on service_images(service_id);

create table service_availability (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  provider_id uuid not null references profiles(id) on delete cascade,
  available_date date not null, start_time time, end_time time,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
create index on service_availability(service_id, available_date);

create table rental_details (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null unique references services(id) on delete cascade,
  requires_deposit boolean not null default false,
  deposit_amount numeric(14,2) check (deposit_amount >= 0),
  minimum_duration integer check (minimum_duration > 0),
  maximum_duration integer check (maximum_duration > 0),
  rental_terms text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  customer_id uuid not null references profiles(id) on delete restrict,
  provider_id uuid not null references profiles(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  service_type text not null,
  booking_date date, start_time time, end_time time,
  rental_start_date date, rental_end_date date,
  pickup_location text, return_location text,
  quantity integer not null default 1 check (quantity > 0),
  duration integer not null default 1 check (duration > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),   -- snapshot harga
  total_price numeric(14,2) not null check (total_price >= 0),
  notes text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','confirmed','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on bookings(customer_id); create index on bookings(provider_id);
create index on bookings(service_id, status);

create table booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  changed_by uuid references profiles(id),
  previous_status text, new_status text not null, note text,
  created_at timestamptz not null default now()
);

create table booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  payment_method text, amount numeric(14,2) check (amount >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  payment_note text, paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  customer_id uuid not null references profiles(id),
  provider_id uuid not null references profiles(id),
  service_id uuid not null references services(id),
  rating integer not null check (rating between 1 and 5),
  comment text, provider_reply text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on reviews(service_id); create index on reviews(provider_id);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  provider_id uuid not null references profiles(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (customer_id, provider_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  message text not null check (length(message) between 1 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on messages(conversation_id, created_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null, message text, type text, related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications(user_id, is_read);

create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, service_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_user_id uuid references profiles(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  reason text not null, description text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  admin_note text,
  created_at timestamptz not null default now()
);

create table user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id), check (blocker_id <> blocked_id)
);

create table site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique, setting_value jsonb,
  updated_at timestamptz not null default now()
);

-- updated_at triggers
do $$ declare t text; begin
  foreach t in array array['profiles','provider_profiles','categories','services','rental_details','bookings','reviews','site_settings'] loop
    execute format('create trigger trg_%1$s_upd before update on %1$s for each row execute function set_updated_at()', t);
  end loop; end $$;

-- ---------- Auth helpers ----------
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') $$;

create or replace function is_blocked_between(a uuid, b uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from user_blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a)) $$;

-- Profil + role customer otomatis saat registrasi (TIDAK pernah admin)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, email, full_name) values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  insert into user_roles(user_id, role) values (new.id, 'customer');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Aktifkan mode provider (aman, hanya role provider)
create or replace function become_provider(p_business_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Unauthenticated'; end if;
  insert into user_roles(user_id, role) values (auth.uid(), 'provider') on conflict do nothing;
  insert into provider_profiles(user_id, business_name) values (auth.uid(), p_business_name) on conflict (user_id) do nothing;
end $$;

-- View profil publik (tanpa email/telepon/tgl lahir)
create view public_profiles as
  select id, full_name, username, avatar_url, bio, location from profiles where account_status = 'active';
grant select on public_profiles to anon, authenticated;

-- ---------- Booking: harga & validasi di server, atomic ----------
create or replace function create_booking(
  p_service_id uuid, p_booking_date date default null, p_start_time time default null,
  p_duration integer default 1, p_rental_start date default null, p_rental_end date default null,
  p_pickup text default null, p_return text default null, p_quantity integer default 1, p_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare s services%rowtype; v_dur int; v_total numeric; v_end time; v_id uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Unauthenticated'; end if;
  if not exists (select 1 from profiles where id=v_uid and account_status='active') then raise exception 'Akun tidak aktif'; end if;
  select * into s from services where id = p_service_id and status = 'published';
  if not found then raise exception 'Layanan tidak tersedia'; end if;
  if s.provider_id = v_uid then raise exception 'Tidak dapat memesan layanan sendiri'; end if;
  if is_blocked_between(v_uid, s.provider_id) then raise exception 'Pemesanan tidak diizinkan'; end if;
  if coalesce(p_quantity,1) < 1 then raise exception 'Jumlah tidak valid'; end if;

  perform pg_advisory_xact_lock(hashtext(p_service_id::text)); -- cegah booking ganda

  if s.service_type = 'rental' then
    if p_rental_start is null or p_rental_end is null or p_rental_end < p_rental_start or p_rental_start < current_date
      then raise exception 'Tanggal sewa tidak valid'; end if;
    v_dur := (p_rental_end - p_rental_start) + 1;
    if exists (select 1 from rental_details r where r.service_id=s.id and
        ((r.minimum_duration is not null and v_dur < r.minimum_duration) or (r.maximum_duration is not null and v_dur > r.maximum_duration)))
      then raise exception 'Durasi sewa di luar batas'; end if;
    if exists (select 1 from bookings b where b.service_id=s.id and b.status in ('pending','accepted','confirmed','in_progress')
        and b.rental_start_date <= p_rental_end and b.rental_end_date >= p_rental_start)
      then raise exception 'Tanggal sewa sudah dipesan'; end if;
  else
    if p_booking_date is null or p_booking_date < current_date then raise exception 'Tanggal tidak valid'; end if;
    v_dur := case when s.pricing_unit in ('per_hour','per_day') then greatest(coalesce(p_duration,1),1) else 1 end;
    if p_start_time is not null and s.pricing_unit = 'per_hour' then v_end := p_start_time + make_interval(hours => v_dur); end if;
    if exists (select 1 from service_availability a where a.service_id=s.id and a.available_date=p_booking_date)
       and not exists (select 1 from service_availability a where a.service_id=s.id and a.available_date=p_booking_date and a.is_available
            and (a.start_time is null or p_start_time is null or (p_start_time >= a.start_time and (v_end is null or a.end_time is null or v_end <= a.end_time))))
      then raise exception 'Jadwal tidak tersedia'; end if;
    if p_start_time is not null and exists (select 1 from bookings b where b.service_id=s.id and b.booking_date=p_booking_date
        and b.status in ('pending','accepted','confirmed','in_progress') and b.start_time is not null
        and b.start_time < coalesce(v_end, p_start_time + interval '1 minute') and coalesce(b.end_time, b.start_time + interval '1 minute') > p_start_time)
      then raise exception 'Jadwal bentrok'; end if;
  end if;

  v_total := s.price * v_dur * greatest(coalesce(p_quantity,1),1);
  insert into bookings(customer_id, provider_id, service_id, service_type, booking_date, start_time, end_time,
      rental_start_date, rental_end_date, pickup_location, return_location, quantity, duration, unit_price, total_price, notes)
  values (v_uid, s.provider_id, s.id, s.service_type, p_booking_date, p_start_time, v_end,
      p_rental_start, p_rental_end, p_pickup, p_return, greatest(coalesce(p_quantity,1),1), v_dur, s.price, v_total, left(p_notes,1000))
  returning id into v_id;
  insert into booking_status_history(booking_id, changed_by, new_status) values (v_id, v_uid, 'pending');
  insert into notifications(user_id, title, message, type, related_id)
    values (s.provider_id, 'Pesanan baru', 'Ada permintaan pemesanan untuk ' || s.title, 'booking', v_id);
  return v_id;
end $$;

create or replace function change_booking_status(p_booking_id uuid, p_new text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; v_uid uuid := auth.uid(); ok boolean := false; adm boolean := is_admin();
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking tidak ditemukan'; end if;
  if adm then ok := true;
  elsif v_uid = b.provider_id then
    ok := (b.status='pending' and p_new in ('accepted','rejected')) or (b.status='accepted' and p_new in ('confirmed','cancelled'))
       or (b.status='confirmed' and p_new in ('in_progress','cancelled')) or (b.status='in_progress' and p_new='completed');
  elsif v_uid = b.customer_id then
    ok := b.status in ('pending','accepted','confirmed') and p_new = 'cancelled';
  end if;
  if not ok then raise exception 'Transisi status tidak diizinkan (% -> %)', b.status, p_new; end if;
  update bookings set status = p_new where id = b.id;
  insert into booking_status_history(booking_id, changed_by, previous_status, new_status, note) values (b.id, v_uid, b.status, p_new, p_note);
  insert into notifications(user_id, title, message, type, related_id)
    values (case when v_uid = b.customer_id then b.provider_id else b.customer_id end,
            'Status pesanan: ' || p_new, 'Kode ' || b.booking_code, 'booking', b.id);
end $$;

create or replace function get_or_create_conversation(p_other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null or p_other = v_uid then raise exception 'Tidak valid'; end if;
  if is_blocked_between(v_uid, p_other) then raise exception 'Tidak diizinkan'; end if;
  select id into v_id from conversations where (customer_id=v_uid and provider_id=p_other) or (customer_id=p_other and provider_id=v_uid);
  if v_id is null then insert into conversations(customer_id, provider_id) values (v_uid, p_other) returning id into v_id; end if;
  return v_id;
end $$;

-- Rating rata-rata
create or replace function refresh_provider_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.provider_id, old.provider_id);
begin
  update provider_profiles set
    average_rating = coalesce((select round(avg(rating)::numeric,2) from reviews where provider_id=pid),0),
    total_reviews = (select count(*) from reviews where provider_id=pid)
  where user_id = pid;
  return null;
end $$;
create trigger trg_reviews_rating after insert or update or delete on reviews for each row execute function refresh_provider_rating();

-- Review: provider_id & service_id diambil dari booking (anti-manipulasi)
create or replace function reviews_fill() returns trigger language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype;
begin
  select * into b from bookings where id = new.booking_id;
  if not found or b.status <> 'completed' or b.customer_id <> auth.uid() then raise exception 'Booking tidak dapat diulas'; end if;
  new.customer_id := b.customer_id; new.provider_id := b.provider_id; new.service_id := b.service_id;
  return new;
end $$;
create trigger trg_reviews_fill before insert on reviews for each row execute function reviews_fill();

-- ---------- RLS ----------
do $$ declare t text; begin
  foreach t in array array['profiles','user_roles','provider_profiles','categories','services','service_images','service_availability',
    'rental_details','bookings','booking_status_history','booking_payments','reviews','conversations','messages','notifications',
    'favorites','reports','user_blocks','site_settings'] loop
    execute format('alter table %I enable row level security', t);
  end loop; end $$;

-- profiles (kolom sensitif dikunci lewat column privilege)
revoke update on profiles from authenticated, anon;
grant update (full_name, username, phone, avatar_url, bio, location, date_of_birth) on profiles to authenticated;
create policy profiles_select on profiles for select to authenticated using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create or replace function admin_set_account_status(p_user uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Forbidden'; end if;
  if p_status not in ('active','suspended','banned') then raise exception 'Status tidak valid'; end if;
  update profiles set account_status = p_status where id = p_user;
end $$;

-- user_roles: baca milik sendiri; tulis hanya via fungsi security definer / admin
create policy roles_select on user_roles for select to authenticated using (user_id = auth.uid() or is_admin());
create policy roles_admin_all on user_roles for all to authenticated using (is_admin()) with check (is_admin());

-- provider_profiles
create policy pp_select on provider_profiles for select using (is_active or user_id = auth.uid() or is_admin());
create policy pp_update on provider_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on provider_profiles from authenticated;
grant update (business_name, description) on provider_profiles to authenticated;
create policy pp_admin on provider_profiles for all to authenticated using (is_admin()) with check (is_admin());

-- categories
create policy cat_select on categories for select using (is_active or is_admin());
create policy cat_admin on categories for all to authenticated using (is_admin()) with check (is_admin());

-- services
create policy svc_select on services for select using (status = 'published' or provider_id = auth.uid() or is_admin());
create policy svc_insert on services for insert to authenticated
  with check (provider_id = auth.uid() and status in ('draft','pending_review')
              and exists (select 1 from user_roles where user_id=auth.uid() and role='provider'));
create policy svc_update on services for update to authenticated
  using (provider_id = auth.uid()) with check (provider_id = auth.uid() and status in ('draft','pending_review','archived') and is_featured = false);
create policy svc_admin on services for all to authenticated using (is_admin()) with check (is_admin());

-- service_images / availability / rental_details: ikut kepemilikan layanan
create policy img_select on service_images for select using (exists (select 1 from services s where s.id=service_id and (s.status='published' or s.provider_id=auth.uid() or is_admin())));
create policy img_write on service_images for all to authenticated
  using (exists (select 1 from services s where s.id=service_id and (s.provider_id=auth.uid() or is_admin())))
  with check (exists (select 1 from services s where s.id=service_id and (s.provider_id=auth.uid() or is_admin())));
create policy av_select on service_availability for select using (exists (select 1 from services s where s.id=service_id and (s.status='published' or s.provider_id=auth.uid() or is_admin())));
create policy av_write on service_availability for all to authenticated
  using (provider_id = auth.uid() or is_admin())
  with check ((provider_id = auth.uid() and exists (select 1 from services s where s.id=service_id and s.provider_id=auth.uid())) or is_admin());
create policy rd_select on rental_details for select using (exists (select 1 from services s where s.id=service_id and (s.status='published' or s.provider_id=auth.uid() or is_admin())));
create policy rd_write on rental_details for all to authenticated
  using (exists (select 1 from services s where s.id=service_id and (s.provider_id=auth.uid() or is_admin())))
  with check (exists (select 1 from services s where s.id=service_id and (s.provider_id=auth.uid() or is_admin())));

-- bookings: HANYA baca; tulis lewat create_booking / change_booking_status
create policy bk_select on bookings for select to authenticated using (customer_id = auth.uid() or provider_id = auth.uid() or is_admin());
create policy bsh_select on booking_status_history for select to authenticated
  using (exists (select 1 from bookings b where b.id=booking_id and (b.customer_id=auth.uid() or b.provider_id=auth.uid() or is_admin())));
create policy bp_select on booking_payments for select to authenticated
  using (exists (select 1 from bookings b where b.id=booking_id and (b.customer_id=auth.uid() or b.provider_id=auth.uid() or is_admin())));
create policy bp_write on booking_payments for all to authenticated
  using (exists (select 1 from bookings b where b.id=booking_id and (b.provider_id=auth.uid() or is_admin())))
  with check (exists (select 1 from bookings b where b.id=booking_id and (b.provider_id=auth.uid() or is_admin())));

-- reviews
create policy rv_select on reviews for select using (true);
create policy rv_insert on reviews for insert to authenticated with check (customer_id = auth.uid());
revoke update on reviews from authenticated; grant update (provider_reply) on reviews to authenticated;
create policy rv_reply on reviews for update to authenticated using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy rv_admin on reviews for all to authenticated using (is_admin()) with check (is_admin());

-- chat
create policy cv_select on conversations for select to authenticated using (customer_id = auth.uid() or provider_id = auth.uid() or is_admin());
create policy msg_select on messages for select to authenticated
  using (exists (select 1 from conversations c where c.id=conversation_id and (c.customer_id=auth.uid() or c.provider_id=auth.uid())));
create policy msg_insert on messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (select 1 from conversations c where c.id=conversation_id
     and (c.customer_id=auth.uid() or c.provider_id=auth.uid()) and not is_blocked_between(c.customer_id, c.provider_id)));
revoke update on messages from authenticated; grant update (is_read) on messages to authenticated;
create policy msg_read on messages for update to authenticated using (sender_id <> auth.uid() and exists
  (select 1 from conversations c where c.id=conversation_id and (c.customer_id=auth.uid() or c.provider_id=auth.uid())));

-- notifications
create policy nt_select on notifications for select to authenticated using (user_id = auth.uid());
revoke update on notifications from authenticated; grant update (is_read) on notifications to authenticated;
create policy nt_update on notifications for update to authenticated using (user_id = auth.uid());

-- favorites & blocks
create policy fav_all on favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy blk_all on user_blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- reports
create policy rp_insert on reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'open' and admin_note is null);
create policy rp_select on reports for select to authenticated using (reporter_id = auth.uid() or is_admin());
create policy rp_admin on reports for update to authenticated using (is_admin()) with check (is_admin());

-- site_settings
create policy ss_select on site_settings for select using (true);
create policy ss_admin on site_settings for all to authenticated using (is_admin()) with check (is_admin());

-- ---------- Storage (bucket publik, upload hanya ke folder milik sendiri) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp']),
  ('service-images','service-images',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('provider-images','provider-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public read images" on storage.objects for select
  using (bucket_id in ('avatars','service-images','provider-images'));
create policy "own folder upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','service-images','provider-images') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own folder modify" on storage.objects for update to authenticated
  using (bucket_id in ('avatars','service-images','provider-images') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own folder delete" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars','service-images','provider-images') and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Seed kategori ----------
insert into categories (name, slug, icon, sort_order) values
  ('Jasa Profesional','jasa-profesional','briefcase',1),
  ('Jasa Transportasi','jasa-transportasi','car',2),
  ('Jasa Sosial & Pendamping','jasa-sosial-pendamping','users',3),
  ('Jasa Rumah Tangga','jasa-rumah-tangga','home',4),
  ('Rental Barang & Kendaraan','rental-barang-kendaraan','key',5);

insert into categories (parent_id, name, slug, sort_order)
select p.id, v.name, v.slug, v.ord from categories p
join (values
  ('jasa-profesional','Jasa Mengajar','jasa-mengajar',1),('jasa-profesional','Les Privat','les-privat',2),
  ('jasa-profesional','Desain Grafis','desain-grafis',3),('jasa-profesional','Pembuatan Website','pembuatan-website',4),
  ('jasa-profesional','Fotografi','fotografi',5),('jasa-profesional','Editing Video','editing-video',6),
  ('jasa-profesional','Penulisan','penulisan',7),('jasa-profesional','Penerjemahan','penerjemahan',8),
  ('jasa-transportasi','Antar Jemput Sekolah','antar-jemput-sekolah',1),('jasa-transportasi','Antar Jemput Kerja','antar-jemput-kerja',2),
  ('jasa-transportasi','Jasa Pengiriman','jasa-pengiriman',3),
  ('jasa-sosial-pendamping','Rental Pacar (non-seksual, 18+)','rental-pacar',1),('jasa-sosial-pendamping','Teman Jalan','teman-jalan',2),
  ('jasa-sosial-pendamping','Teman Makan','teman-makan',3),('jasa-sosial-pendamping','Teman Menghadiri Acara','teman-acara',4),
  ('jasa-rumah-tangga','Bersih-bersih','bersih-bersih',1),('jasa-rumah-tangga','Reparasi','reparasi',2),
  ('jasa-rumah-tangga','Pertukangan','pertukangan',3),('jasa-rumah-tangga','Cuci Kendaraan','cuci-kendaraan',4),
  ('rental-barang-kendaraan','Rental Mobil','rental-mobil',1),('rental-barang-kendaraan','Rental Motor','rental-motor',2),
  ('rental-barang-kendaraan','Rental Kamera','rental-kamera',3),('rental-barang-kendaraan','Rental Laptop','rental-laptop',4),
  ('rental-barang-kendaraan','Perlengkapan Acara','perlengkapan-acara',5)
) as v(parent_slug,name,slug,ord) on p.slug = v.parent_slug;

insert into site_settings(setting_key, setting_value) values
  ('brand', '{"name":"Multi-Service & Rental Marketplace","tagline":"Semua Kebutuhan Jasa, Ada di Satu Tempat."}');

-- ---------- Menjadikan admin (jalankan MANUAL, ganti email) ----------
-- insert into user_roles(user_id, role) select id, 'admin' from profiles where email = 'emailanda@contoh.com';
