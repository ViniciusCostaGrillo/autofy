-- Enable pg_net and pg_cron extensions if they are not already installed
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Create the fuel_prices table
create table if not exists public.fuel_prices (
  state text not null,
  city text not null,
  product text not null,
  price numeric(5,2) not null,
  week_label text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (state, city, product)
);

-- Enable RLS
alter table public.fuel_prices enable row level security;

-- Policies
create policy "Allow public read access"
  on public.fuel_prices
  for select
  to public
  using (true);

create policy "Allow service_role full access"
  on public.fuel_prices
  for all
  to service_role
  using (true)
  with check (true);

-- Schedule daily cron job (every day at 4:00 AM UTC) to call the sync-fuel-prices edge function.
-- This uses pg_net to make an asynchronous HTTP POST request.
select cron.schedule(
  'sync-fuel-prices-daily',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://izxmnsvdmojkbhclpdjj.supabase.co/functions/v1/sync-fuel-prices',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
