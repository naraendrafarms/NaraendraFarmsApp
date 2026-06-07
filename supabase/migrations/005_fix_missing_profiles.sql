-- Fix: insert profiles for any auth users that are missing a profile row
-- This covers users created when the old code failed mid-way
INSERT INTO public.profiles (id, full_name, email, role, is_active)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1)) AS full_name,
  u.email,
  COALESCE(u.raw_user_meta_data->>'role', 'viewer') AS role,
  true
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email != ''
  AND u.deleted_at IS NULL;

-- Also update admin email if missing
UPDATE public.profiles
SET email = (SELECT email FROM auth.users WHERE id = public.profiles.id)
WHERE email IS NULL OR email = '';
