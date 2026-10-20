-- El borrado lógico necesita actualizar una fila que deja de ser visible bajo SELECT.
-- La operación privilegiada queda fuera de los esquemas expuestos y solo modifica contenido propio.
CREATE SCHEMA lexa_social;
REVOKE ALL ON SCHEMA lexa_social FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA lexa_social TO authenticated;
CREATE FUNCTION lexa_social.remove_own_content(p_type text, p_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE affected integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sesión requerida' USING ERRCODE='42501'; END IF;
  IF p_type='review' THEN
    UPDATE public.reviews SET deleted_at=now() WHERE id=p_id AND user_id=auth.uid() AND deleted_at IS NULL;
  ELSIF p_type='comment' THEN
    UPDATE public.comments SET deleted_at=now() WHERE id=p_id AND user_id=auth.uid() AND deleted_at IS NULL;
  ELSE RAISE EXCEPTION 'Tipo de contenido inválido' USING ERRCODE='22023';
  END IF;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected=1;
END; $$;
REVOKE ALL ON FUNCTION lexa_social.remove_own_content(text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION lexa_social.remove_own_content(text,uuid) TO authenticated;

-- Mantiene una entrada invocadora sin exponer una función SECURITY DEFINER en public.
CREATE FUNCTION public.remove_own_content(p_type text, p_id uuid) RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT lexa_social.remove_own_content(p_type,p_id);
$$;
REVOKE ALL ON FUNCTION public.remove_own_content(text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_own_content(text,uuid) TO authenticated;
