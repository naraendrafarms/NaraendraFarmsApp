-- Migration 034: Simplified admin_create_user — no optional auth columns

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

  -- Check if email already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role,
      email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name, 'role', p_role),
      false
    );
  ELSE
    UPDATE auth.users SET
      encrypted_password = crypt(p_password, gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('full_name', p_full_name, 'role', p_role),
      updated_at         = NOW(),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;
  END IF;

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
