-- Fix profiles where email is missing — copy from auth.users
-- Runs as service role so has access to auth schema
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');
