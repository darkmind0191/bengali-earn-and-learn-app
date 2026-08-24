/*
# Fix: handle_new_user trigger function search_path

## Problem
The `handle_new_user()` trigger function uses `SET search_path = public`, but
`gen_random_bytes()` lives in the `extensions` schema (from the pgcrypto extension).
With only `public` in the search path, the function call fails at signup time,
causing "Database error saving new user".

## Fix
Recreate `handle_new_user()` with `SET search_path = public, extensions` so
`gen_random_bytes()` resolves correctly. Also schema-qualify the call as
`extensions.gen_random_bytes` for extra safety.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_code text;
  v_is_first boolean;
BEGIN
  v_code := upper(substr(encode(extensions.gen_random_bytes(5), 'hex'), 1, 8));
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first;
  INSERT INTO public.profiles (id, referral_code, is_admin)
  VALUES (NEW.id, v_code, v_is_first);
  RETURN NEW;
END;
$$;
