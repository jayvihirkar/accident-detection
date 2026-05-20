-- Sends newly inserted accident_events rows to the send-crash-sms Edge Function.
--
-- Before running:
-- 1. Deploy the Edge Function:
--    supabase functions deploy send-crash-sms --no-verify-jwt
-- 2. Replace the URL and secret below.

create extension if not exists pg_net;

create or replace function public.notify_crash_sms()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  edge_function_url text := 'https://rqxnweglbnbzgoqvipda.supabase.co/functions/v1/send-crash-sms';
  webhook_secret text := 'my-super-long-secret-12345678';
begin
  perform net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-crash-sms-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'schema', TG_TABLE_SCHEMA,
      'table', TG_TABLE_NAME,
      'record', to_jsonb(NEW)
    )
  );

  return NEW;
end;
$$;

drop trigger if exists accident_events_send_crash_sms on public.accident_events;

create trigger accident_events_send_crash_sms
after insert on public.accident_events
for each row
execute function public.notify_crash_sms();
