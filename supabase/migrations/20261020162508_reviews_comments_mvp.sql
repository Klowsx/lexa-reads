-- Una reseña activa por lector y libro; las eliminadas conservan sus relaciones históricas.
CREATE UNIQUE INDEX reviews_one_active_per_book ON public.reviews(user_id, book_id) WHERE deleted_at IS NULL;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_meaningful_body CHECK (char_length(btrim(body)) BETWEEN 10 AND 10000) NOT VALID;
ALTER TABLE public.comments ADD COLUMN contains_spoilers boolean NOT NULL DEFAULT false;
ALTER TABLE public.comments ADD CONSTRAINT comments_meaningful_body CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000) NOT VALID;

-- El contenido eliminado nunca reaparece por una consulta del propietario o una relación del feed.
DROP POLICY "Usuario gestiona sus propias reseñas" ON public.reviews;
DROP POLICY "Reseñas publicadas visibles para todos" ON public.reviews;
CREATE POLICY "Reseñas visibles y activas" ON public.reviews FOR SELECT TO authenticated USING (
  deleted_at IS NULL AND NOT public.is_blocked_with(user_id)
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id AND u.deleted_at IS NULL)
  AND (user_id = auth.uid() OR (is_published AND public.can_view_user_content(user_id)))
);
CREATE POLICY "Crear reseña propia" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND deleted_at IS NULL
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id AND u.deleted_at IS NULL)
);
CREATE POLICY "Editar reseña propia" ON public.reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Eliminar reseña propia" ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comprueba identidad y vincula la puntuación del mismo usuario y libro cuando ya existe.
CREATE OR REPLACE FUNCTION public.validate_review_record() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.id <> OLD.id OR NEW.user_id <> OLD.user_id OR NEW.book_id <> OLD.book_id) THEN
    RAISE EXCEPTION 'La identidad de la reseña no se puede cambiar' USING ERRCODE = '22023';
  END IF;
  IF NEW.user_book_id IS NULL THEN
    SELECT id INTO NEW.user_book_id FROM public.user_books WHERE user_id=NEW.user_id AND book_id=NEW.book_id;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_books WHERE id=NEW.user_book_id AND user_id=NEW.user_id AND book_id=NEW.book_id) THEN
    RAISE EXCEPTION 'La lectura no pertenece a esta reseña' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validate_review_record() FROM PUBLIC, anon;
CREATE TRIGGER validate_review_record BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.validate_review_record();

-- Publicar produce una actividad en la misma transacción, sin duplicarla al editar el texto.
CREATE UNIQUE INDEX activity_one_per_review ON public.activity_feed(review_id) WHERE activity_type='wrote_review';
CREATE OR REPLACE FUNCTION public.publish_review_activity() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.is_published AND NEW.deleted_at IS NULL THEN
    INSERT INTO public.activity_feed(user_id, activity_type, book_id, review_id)
    VALUES(NEW.user_id, 'wrote_review', NEW.book_id, NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.publish_review_activity() FROM PUBLIC, anon;
CREATE TRIGGER publish_review_activity AFTER INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.publish_review_activity();

-- Un hilo de actividad hereda también la privacidad y la vigencia de la reseña asociada.
DROP POLICY "Feed visible respetando privacidad" ON public.activity_feed;
CREATE POLICY "Feed visible respetando privacidad" ON public.activity_feed FOR SELECT TO authenticated USING (
  NOT public.is_blocked_with(user_id) AND public.can_view_user_content(user_id)
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id=user_id AND u.deleted_at IS NULL)
  AND (user_id=auth.uid() OR EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id=auth.uid() AND f.following_id=activity_feed.user_id AND f.status='accepted'))
  AND (activity_type <> 'wrote_review' OR EXISTS (SELECT 1 FROM public.reviews r WHERE r.id=review_id AND r.user_id=activity_feed.user_id AND r.is_published AND r.deleted_at IS NULL))
);

-- Consulta el padre bajo las mismas políticas RLS que una consulta directa; nunca eleva privilegios.
CREATE OR REPLACE FUNCTION public.can_access_comment_target(p_type public.comment_target_type, p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND CASE p_type
    WHEN 'review' THEN EXISTS (SELECT 1 FROM public.reviews r WHERE r.id=p_id AND r.is_published AND r.deleted_at IS NULL)
    WHEN 'activity' THEN EXISTS (SELECT 1 FROM public.activity_feed a WHERE a.id=p_id)
    ELSE false END;
$$;
REVOKE ALL ON FUNCTION public.can_access_comment_target(public.comment_target_type,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_comment_target(public.comment_target_type,uuid) TO authenticated;

DROP POLICY "Comentarios públicos visibles para todos" ON public.comments;
DROP POLICY "Usuario crea comentarios" ON public.comments;
DROP POLICY "Usuario edita sus propios comentarios" ON public.comments;
DROP POLICY "Usuario elimina sus propios comentarios" ON public.comments;
CREATE POLICY "Comentarios heredan acceso al padre" ON public.comments FOR SELECT TO authenticated USING (
  deleted_at IS NULL AND NOT public.is_blocked_with(user_id)
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id=user_id AND u.deleted_at IS NULL)
  AND public.can_access_comment_target(target_type, target_id)
);
CREATE POLICY "Crear comentario en padre visible" ON public.comments FOR INSERT TO authenticated WITH CHECK (
  user_id=auth.uid() AND deleted_at IS NULL AND public.can_access_comment_target(target_type,target_id)
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id=user_id AND u.deleted_at IS NULL)
);
CREATE POLICY "Editar comentario propio visible" ON public.comments FOR UPDATE TO authenticated
  USING (user_id=auth.uid() AND deleted_at IS NULL AND public.can_access_comment_target(target_type,target_id))
  WITH CHECK (user_id=auth.uid() AND public.can_access_comment_target(target_type,target_id));
CREATE POLICY "Eliminar comentario propio visible" ON public.comments FOR DELETE TO authenticated
  USING (user_id=auth.uid() AND public.can_access_comment_target(target_type,target_id));

-- Evita mover comentarios entre hilos o enlazar respuestas con un padre oculto o de otro contenido.
CREATE OR REPLACE FUNCTION public.validate_comment_thread() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF TG_OP='UPDATE' AND (NEW.id<>OLD.id OR NEW.user_id<>OLD.user_id OR NEW.target_id<>OLD.target_id OR NEW.target_type<>OLD.target_type OR NEW.parent_id IS DISTINCT FROM OLD.parent_id) THEN
    RAISE EXCEPTION 'El comentario no se puede mover a otro hilo' USING ERRCODE='22023';
  END IF;
  IF NOT public.can_access_comment_target(NEW.target_type,NEW.target_id) THEN
    RAISE EXCEPTION 'El contenido no está disponible' USING ERRCODE='42501';
  END IF;
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.comments c WHERE c.id=NEW.parent_id AND c.target_id=NEW.target_id AND c.target_type=NEW.target_type AND c.deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Respuesta fuera del hilo' USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validate_comment_thread() FROM PUBLIC, anon;
CREATE TRIGGER validate_comment_thread BEFORE INSERT OR UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.validate_comment_thread();
