-- Allow authenticated users to insert only their own profile row.
-- Safety net when the auth.users → profiles trigger did not run or failed.
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);
