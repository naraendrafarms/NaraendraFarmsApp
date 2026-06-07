-- Add management role to profiles check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin','management','accounts','site_manager','site_incharge','viewer'));

-- Admin user creation function (called via supabase.rpc from frontend)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email     TEXT,
  p_password  TEXT,
  p_full_name TEXT,
  p_role      TEXT,
  p_farm_id   UUID DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_role TEXT;
  v_user_id     UUID;
BEGIN
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admin users can create users';
  END IF;
  v_user_id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, is_super_admin, role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(), NOW(), NOW(),
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    false,
    'authenticated'
  );
  INSERT INTO public.profiles (id, full_name, email, role, farm_id, is_active)
  VALUES (v_user_id, p_full_name, p_email, p_role, p_farm_id, p_is_active)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email     = EXCLUDED.email,
    role      = EXCLUDED.role,
    farm_id   = EXCLUDED.farm_id,
    is_active = EXCLUDED.is_active;
  RETURN v_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;

-- Admin password update function
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  p_user_id  UUID,
  p_password TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admin users can change passwords';
  END IF;
  UPDATE auth.users
  SET encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_user_password TO authenticated;
