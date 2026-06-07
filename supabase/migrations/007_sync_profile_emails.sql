-- Sync emails from auth.users into profiles using SECURITY DEFINER
-- (MGMT API can't read auth schema directly, but SECURITY DEFINER functions can)
CREATE OR REPLACE FUNCTION public.sync_profile_emails()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE updated_count INTEGER;
BEGIN
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
    AND (p.email IS NULL OR p.email = '');
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

SELECT public.sync_profile_emails();

DROP FUNCTION public.sync_profile_emails();
