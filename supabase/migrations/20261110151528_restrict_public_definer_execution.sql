-- Retira el acceso anónimo a RPC privilegiadas sin cambiar los permisos autenticados existentes.
-- Las funciones de trigger se mantienen fuera de este cambio: no son invocables como RPC ordinarias.
DO $permissions$
DECLARE
  routine record;
BEGIN
  FOR routine IN
    SELECT p.oid::regprocedure AS signature,
           p.proname,
           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS had_authenticated,
           has_function_privilege('service_role', p.oid, 'EXECUTE') AS had_service
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype <> 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', routine.signature);

    -- El trabajo de borrado y el contador interno solo se ejecutan desde procesos privilegiados.
    IF routine.proname IN ('hard_delete_due_accounts', 'hit_rate_limit') THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', routine.signature);
    ELSIF routine.had_authenticated THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', routine.signature);
    END IF;

    IF routine.had_service THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', routine.signature);
    END IF;
  END LOOP;
END;
$permissions$;
