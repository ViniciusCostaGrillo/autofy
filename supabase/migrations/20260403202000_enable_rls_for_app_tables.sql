alter table if exists public.vehicles enable row level security;
alter table if exists public.trips enable row level security;
alter table if exists public.refuels enable row level security;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vehicles' and column_name = 'user_id'
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'vehicles' and policyname = 'vehicles_select_own'
    ) then
      create policy "vehicles_select_own"
      on public.vehicles
      for select
      to authenticated
      using (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'vehicles' and policyname = 'vehicles_insert_own'
    ) then
      create policy "vehicles_insert_own"
      on public.vehicles
      for insert
      to authenticated
      with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'vehicles' and policyname = 'vehicles_update_own'
    ) then
      create policy "vehicles_update_own"
      on public.vehicles
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'vehicles' and policyname = 'vehicles_delete_own'
    ) then
      create policy "vehicles_delete_own"
      on public.vehicles
      for delete
      to authenticated
      using (auth.uid() = user_id);
    end if;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trips' and column_name = 'user_id'
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'trips' and policyname = 'trips_select_own'
    ) then
      create policy "trips_select_own"
      on public.trips
      for select
      to authenticated
      using (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'trips' and policyname = 'trips_insert_own'
    ) then
      create policy "trips_insert_own"
      on public.trips
      for insert
      to authenticated
      with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'trips' and policyname = 'trips_update_own'
    ) then
      create policy "trips_update_own"
      on public.trips
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'trips' and policyname = 'trips_delete_own'
    ) then
      create policy "trips_delete_own"
      on public.trips
      for delete
      to authenticated
      using (auth.uid() = user_id);
    end if;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'refuels' and column_name = 'user_id'
  ) then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'refuels' and policyname = 'refuels_select_own'
    ) then
      create policy "refuels_select_own"
      on public.refuels
      for select
      to authenticated
      using (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'refuels' and policyname = 'refuels_insert_own'
    ) then
      create policy "refuels_insert_own"
      on public.refuels
      for insert
      to authenticated
      with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'refuels' and policyname = 'refuels_update_own'
    ) then
      create policy "refuels_update_own"
      on public.refuels
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'refuels' and policyname = 'refuels_delete_own'
    ) then
      create policy "refuels_delete_own"
      on public.refuels
      for delete
      to authenticated
      using (auth.uid() = user_id);
    end if;
  end if;
end
$$;
