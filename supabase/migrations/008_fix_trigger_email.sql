-- Fix handle_new_user trigger to always save email into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email     = COALESCE(EXCLUDED.email, public.profiles.email),
    role      = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN NEW;
END;
$$;
