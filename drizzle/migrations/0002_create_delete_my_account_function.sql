CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.favorites WHERE user_id = _uid;
  DELETE FROM public.reading_history WHERE user_id = _uid;
  DELETE FROM public.quiz_answers WHERE user_id = _uid;
  DELETE FROM public.user_progress WHERE user_id = _uid;
  DELETE FROM public.subscriptions WHERE user_id = _uid;
  DELETE FROM public.user_roles WHERE user_id = _uid;
  DELETE FROM public.profiles WHERE id = _uid;
  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM anon;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM service_role;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;