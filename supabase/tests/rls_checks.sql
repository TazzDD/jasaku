-- Jalankan di SQL Editor. Ganti UUID dengan id 2 pengguna biasa (A, B) dan 1 booking milik A.
-- Setiap blok mensimulasikan login sebagai pengguna tertentu.
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"UUID_PENGGUNA_B","role":"authenticated"}';
  -- 1) B tidak boleh melihat booking milik A (hasil harus 0)
  select count(*) as harus_0 from bookings where customer_id = 'UUID_PENGGUNA_A';
  -- 2) B tidak boleh mengubah status akunnya (harus error: permission denied)
  -- update profiles set account_status = 'active' where id = 'UUID_PENGGUNA_B';
  -- 3) B tidak boleh menjadi admin (harus error / 0 baris)
  -- insert into user_roles(user_id, role) values ('UUID_PENGGUNA_B', 'admin');
  -- 4) B tidak boleh mengubah harga booking (harus error)
  -- update bookings set total_price = 1 where id = 'UUID_BOOKING_A';
  -- 5) B tidak boleh membaca pesan percakapan A (hasil harus 0)
  select count(*) as harus_0 from messages;
rollback;
