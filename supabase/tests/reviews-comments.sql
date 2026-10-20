-- Recorre permisos, duplicados, spoilers y eliminación con usuarios sintéticos y rollback.
BEGIN;
DO $$ DECLARE owner_id uuid:=gen_random_uuid(); reader_id uuid:=gen_random_uuid(); follower_id uuid:=gen_random_uuid(); book_id uuid:=gen_random_uuid(); BEGIN
  PERFORM set_config('lexa.qa_owner',owner_id::text,true); PERFORM set_config('lexa.qa_reader',reader_id::text,true); PERFORM set_config('lexa.qa_follower',follower_id::text,true); PERFORM set_config('lexa.qa_book',book_id::text,true);
  INSERT INTO auth.users(id) VALUES(owner_id),(reader_id),(follower_id);
  UPDATE public.users SET is_private=true WHERE id=owner_id;
  -- Crea relaciones por el mismo flujo autorizado que usa la aplicación.
  PERFORM set_config('request.jwt.claim.sub',follower_id::text,true);
  INSERT INTO public.follows(follower_id,following_id) VALUES(follower_id,owner_id);
  PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
  UPDATE public.follows SET status='accepted' WHERE following_id=owner_id;
  PERFORM set_config('request.jwt.claim.sub',reader_id::text,true);
  INSERT INTO public.follows(follower_id,following_id) VALUES(reader_id,owner_id);
  INSERT INTO public.books(id,google_books_id,title) VALUES(book_id,'qa_'||substr(replace(book_id::text,'-',''),1,16),'Reseñas de prueba');
END; $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('lexa.qa_owner'),true);
DO $$ DECLARE created_review uuid; BEGIN
  INSERT INTO public.reviews(user_id,book_id,body,contains_spoilers,is_published) VALUES(auth.uid(),current_setting('lexa.qa_book')::uuid,'Una reseña con texto suficiente.',true,true) RETURNING id INTO created_review;
  PERFORM set_config('lexa.qa_review',created_review::text,true);
  PERFORM set_config('lexa.qa_activity',(SELECT id::text FROM public.activity_feed WHERE review_id=created_review),true);
  UPDATE public.reviews SET is_published=false WHERE id=created_review;
  IF public.can_access_comment_target('review',created_review) OR public.can_access_comment_target('activity',current_setting('lexa.qa_activity')::uuid) THEN RAISE EXCEPTION 'Borrador permitió acceder a la conversación'; END IF;
  UPDATE public.reviews SET is_published=true WHERE id=created_review;
  UPDATE public.reviews SET body='Una edición que conserva la misma publicación.',edited_at=now() WHERE id=created_review;
  IF (SELECT count(*) FROM public.activity_feed WHERE review_id=created_review)<>1 THEN RAISE EXCEPTION 'Edición duplicó actividad'; END IF;
  BEGIN
    INSERT INTO public.reviews(user_id,book_id,body,is_published) VALUES(auth.uid(),current_setting('lexa.qa_book')::uuid,'Otra reseña activa duplicada.',true); RAISE EXCEPTION 'Permitió duplicar reseña';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    UPDATE public.reviews SET body='   ' WHERE id=created_review; RAISE EXCEPTION 'Permitió reseña vacía';
  EXCEPTION WHEN check_violation THEN NULL; END;
END; $$ LANGUAGE plpgsql;
SELECT set_config('request.jwt.claim.sub',current_setting('lexa.qa_reader'),true);
DO $$ BEGIN
  IF public.can_access_comment_target('review',current_setting('lexa.qa_review')::uuid) OR public.can_access_comment_target('activity',current_setting('lexa.qa_activity')::uuid) THEN RAISE EXCEPTION 'Seguidor pendiente obtuvo acceso'; END IF;
  BEGIN
    INSERT INTO public.comments(user_id,target_type,target_id,body) VALUES(auth.uid(),'review',current_setting('lexa.qa_review')::uuid,'Comentario sin permiso'); RAISE EXCEPTION 'Permitió comentar padre privado';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
SELECT set_config('request.jwt.claim.sub',current_setting('lexa.qa_follower'),true);
DO $$ DECLARE comment_id uuid; BEGIN
  IF NOT public.can_access_comment_target('review',current_setting('lexa.qa_review')::uuid) THEN RAISE EXCEPTION 'Seguidor aceptado perdió acceso'; END IF;
  IF public.can_access_comment_target('review',gen_random_uuid()) THEN RAISE EXCEPTION 'Padre inexistente obtuvo acceso'; END IF;
  UPDATE public.reviews SET body='Edición de una reseña ajena visible' WHERE id=current_setting('lexa.qa_review')::uuid;
  IF FOUND THEN RAISE EXCEPTION 'Seguidor pudo editar una reseña ajena'; END IF;
  IF public.remove_own_content('review',current_setting('lexa.qa_review')::uuid) THEN RAISE EXCEPTION 'Seguidor pudo retirar una reseña ajena'; END IF;
  INSERT INTO public.comments(user_id,target_type,target_id,body,contains_spoilers) VALUES(auth.uid(),'review',current_setting('lexa.qa_review')::uuid,'Comentario con spoiler',true) RETURNING id INTO comment_id;
  PERFORM set_config('lexa.qa_comment',comment_id::text,true);
  IF NOT (SELECT contains_spoilers FROM public.comments WHERE id=comment_id) THEN RAISE EXCEPTION 'Se perdió marca de spoiler'; END IF;
  IF (SELECT comments_count FROM public.reviews WHERE id=current_setting('lexa.qa_review')::uuid)<>1 THEN RAISE EXCEPTION 'No actualizó contador'; END IF;
  BEGIN
    INSERT INTO public.comments(user_id,target_type,target_id,body) VALUES(auth.uid(),'review',current_setting('lexa.qa_review')::uuid,'  '); RAISE EXCEPTION 'Permitió comentario vacío';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.comments(user_id,target_type,target_id,parent_id,body) VALUES(auth.uid(),'activity',current_setting('lexa.qa_activity')::uuid,comment_id,'Respuesta en otro hilo'); RAISE EXCEPTION 'Permitió respuesta en otro hilo';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    UPDATE public.comments SET target_type='activity',target_id=current_setting('lexa.qa_activity')::uuid WHERE id=comment_id; RAISE EXCEPTION 'Movió comentario de hilo';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF NOT public.remove_own_content('comment',comment_id) THEN RAISE EXCEPTION 'No retiró comentario propio'; END IF;
  IF public.remove_own_content('comment',comment_id) THEN RAISE EXCEPTION 'Retiró dos veces el mismo comentario'; END IF;
  BEGIN
    INSERT INTO public.comments(user_id,target_type,target_id,parent_id,body) VALUES(auth.uid(),'review',current_setting('lexa.qa_review')::uuid,comment_id,'Respuesta a comentario retirado'); RAISE EXCEPTION 'Permitió responder a comentario retirado';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF EXISTS(SELECT 1 FROM public.comments WHERE id=comment_id) THEN RAISE EXCEPTION 'Comentario eliminado sigue visible'; END IF;
  IF (SELECT comments_count FROM public.reviews WHERE id=current_setting('lexa.qa_review')::uuid)<>0 THEN RAISE EXCEPTION 'Contador no volvió a cero'; END IF;
  INSERT INTO public.comments(user_id,target_type,target_id,body) VALUES(auth.uid(),'review',current_setting('lexa.qa_review')::uuid,'Segundo comentario visible') RETURNING id INTO comment_id;
  PERFORM set_config('lexa.qa_comment',comment_id::text,true);
END; $$;
SELECT set_config('request.jwt.claim.sub',current_setting('lexa.qa_reader'),true);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.comments WHERE id=current_setting('lexa.qa_comment')::uuid) THEN RAISE EXCEPTION 'Filtró comentario de padre privado'; END IF;
  UPDATE public.comments SET body='Cambio ajeno' WHERE id=current_setting('lexa.qa_comment')::uuid;
  IF FOUND THEN RAISE EXCEPTION 'Permitió editar comentario ajeno'; END IF;
  IF public.remove_own_content('comment',current_setting('lexa.qa_comment')::uuid) THEN RAISE EXCEPTION 'RPC retiró comentario ajeno'; END IF;
  IF public.remove_own_content('review',current_setting('lexa.qa_review')::uuid) THEN RAISE EXCEPTION 'RPC retiró reseña ajena'; END IF;
END; $$;
RESET ROLE;
INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES(current_setting('lexa.qa_owner')::uuid,current_setting('lexa.qa_follower')::uuid);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('lexa.qa_follower'),true);
DO $$ BEGIN
  IF public.can_access_comment_target('review',current_setting('lexa.qa_review')::uuid) OR EXISTS(SELECT 1 FROM public.comments WHERE id=current_setting('lexa.qa_comment')::uuid) THEN RAISE EXCEPTION 'Bloqueo no protegió hilo'; END IF;
END; $$;
RESET ROLE;
DELETE FROM public.user_blocks WHERE blocker_id=current_setting('lexa.qa_owner')::uuid AND blocked_id=current_setting('lexa.qa_follower')::uuid;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('lexa.qa_owner'),true);
SELECT public.remove_own_content('review',current_setting('lexa.qa_review')::uuid);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.reviews WHERE id=current_setting('lexa.qa_review')::uuid) THEN RAISE EXCEPTION 'Reseña eliminada sigue visible para dueño'; END IF;
  IF EXISTS(SELECT 1 FROM public.activity_feed WHERE id=current_setting('lexa.qa_activity')::uuid) THEN RAISE EXCEPTION 'Actividad de reseña eliminada sigue visible'; END IF;
END; $$;
SELECT set_config('request.jwt.claim.sub',current_setting('lexa.qa_follower'),true);
DO $$ BEGIN
  IF public.can_access_comment_target('review',current_setting('lexa.qa_review')::uuid) OR public.can_access_comment_target('activity',current_setting('lexa.qa_activity')::uuid) OR EXISTS(SELECT 1 FROM public.comments WHERE id=current_setting('lexa.qa_comment')::uuid) THEN RAISE EXCEPTION 'Eliminación dejó contenido accesible'; END IF;
  BEGIN
    INSERT INTO public.comments(user_id,target_type,target_id,body) VALUES(auth.uid(),'review',current_setting('lexa.qa_review')::uuid,'Comentario tras eliminar'); RAISE EXCEPTION 'Comentó reseña eliminada';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
SELECT set_config('request.jwt.claim.sub',current_setting('lexa.qa_owner'),true);
INSERT INTO public.reviews(user_id,book_id,body,is_published) VALUES(auth.uid(),current_setting('lexa.qa_book')::uuid,'Reseña nueva después de eliminar la anterior.',true);
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.comments WHERE target_id=current_setting('lexa.qa_review')::uuid) THEN RAISE EXCEPTION 'Anónimo leyó comentarios'; END IF;
  BEGIN
    PERFORM public.can_access_comment_target('review',current_setting('lexa.qa_review')::uuid); RAISE EXCEPTION 'Anónimo pudo usar helper';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
ROLLBACK;
