-- Actualiza funciones ya desplegadas para usar las políticas RLS del usuario autenticado.
ALTER FUNCTION public.is_username_available(text) SECURITY INVOKER;
ALTER FUNCTION public.complete_onboarding(text) SECURITY INVOKER;

-- Impide que clientes anónimos llamen a los RPC del onboarding.
REVOKE ALL ON FUNCTION public.is_username_available(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_onboarding(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_username_available(text) FROM anon;
REVOKE ALL ON FUNCTION public.complete_onboarding(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text) TO authenticated;
