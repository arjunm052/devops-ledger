-- Run in Supabase SQL Editor (or `supabase db query --linked -f e2e/seed-dummy-author.sql`)
-- Requires at least one row in public.profiles with role = 'author' (the About page uses getAuthorProfile).
-- Sets display name to "Dummy User" for the earliest-created author profile.

UPDATE public.profiles AS p
SET full_name = 'Dummy User'
FROM (
  SELECT id
  FROM public.profiles
  WHERE role = 'author'
  ORDER BY created_at ASC
  LIMIT 1
) AS a
WHERE p.id = a.id;
