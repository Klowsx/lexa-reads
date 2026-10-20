-- Prueba el flujo con dos cuentas sintéticas y revierte todos los datos al finalizar.
BEGIN;
DO $$
DECLARE
  first_id uuid := gen_random_uuid();
  second_id uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('lexa.test_first', first_id::text, true);
  PERFORM set_config('lexa.test_second', second_id::text, true);
  PERFORM set_config('lexa.test_username', 'qa_' || substring(replace(first_id::text, '-', ''), 1, 20), true);
  INSERT INTO auth.users (id, raw_user_meta_data)
  VALUES (first_id, '{"display_name":"Lectura de prueba"}'::jsonb),
         (second_id, '{"full_name":"Nombre compatible"}'::jsonb);
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = first_id AND display_name = 'Lectura de prueba') THEN
    RAISE EXCEPTION 'No se guardó display_name';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = second_id AND display_name = 'Nombre compatible') THEN
    RAISE EXCEPTION 'Se perdió compatibilidad con full_name';
  END IF;
END;
$$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.test_first'), true);
DO $$
DECLARE
  result public.users;
BEGIN
  IF public.is_username_available(NULL) OR public.is_username_available('') OR public.is_username_available('no valido') THEN
    RAISE EXCEPTION 'Se aceptó un nombre inválido en la comprobación';
  END IF;
  UPDATE public.users SET favorite_genres = '{}', reading_goal = 12, onboarding_step = 3
  WHERE id = auth.uid();
  SELECT * INTO result FROM public.complete_onboarding(upper(current_setting('lexa.test_username')));
  IF NOT result.onboarding_completed OR result.onboarding_step <> 3 OR cardinality(result.favorite_genres) <> 0 THEN
    RAISE EXCEPTION 'No se pudo completar saltando géneros';
  END IF;
  IF result.username <> current_setting('lexa.test_username') THEN
    RAISE EXCEPTION 'El nombre no se normalizó';
  END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub', current_setting('lexa.test_second'), true);
DO $$
BEGIN
  -- Un bloqueo no libera el nombre único que la otra cuenta ya reservó.
  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  VALUES (auth.uid(), current_setting('lexa.test_first')::uuid);
  IF public.is_username_available(upper(current_setting('lexa.test_username'))) THEN
    RAISE EXCEPTION 'Se ofreció un nombre ocupado por un perfil oculto';
  END IF;
  BEGIN
    PERFORM public.complete_onboarding(current_setting('lexa.test_username'));
    RAISE EXCEPTION 'Se permitió un nombre duplicado';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    PERFORM public.complete_onboarding(NULL);
    RAISE EXCEPTION 'Se permitió un nombre nulo';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  UPDATE public.users SET onboarding_step = 1 WHERE id = current_setting('lexa.test_first')::uuid;
  IF FOUND THEN RAISE EXCEPTION 'RLS permitió modificar otra cuenta'; END IF;
END;
$$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.is_username_available('lectura_anonima');
    RAISE EXCEPTION 'Se permitió consultar nombres sin sesión';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
RESET ROLE;
ROLLBACK;
