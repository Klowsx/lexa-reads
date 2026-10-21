-- Impide solicitudes activas duplicadas si el usuario reintenta o llegan dos peticiones a la vez.
CREATE UNIQUE INDEX account_deletion_requests_one_active_per_user_idx
  ON public.account_deletion_requests (user_id)
  WHERE cancelled_at IS NULL AND processed_at IS NULL;
