-- Aktifkan Realtime untuk pesan (RLS tetap berlaku pada event realtime)
alter publication supabase_realtime add table messages;

-- Notifikasi otomatis ke lawan bicara saat ada pesan baru
create or replace function notify_new_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare c conversations%rowtype;
begin
  select * into c from conversations where id = new.conversation_id;
  insert into notifications(user_id, title, message, type, related_id)
  values (case when new.sender_id = c.customer_id then c.provider_id else c.customer_id end,
          'Pesan baru', left(new.message, 80), 'message', new.conversation_id);
  return null;
end $$;
create trigger trg_messages_notify after insert on messages for each row execute function notify_new_message();
