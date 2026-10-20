# Reseñas, spoilers y comentarios del MVP

## Alcance y entradas

Reseñas y comentarios se mantienen en el lanzamiento del MVP. Un lector puede publicar una reseña por libro, editarla y retirarla. El editor se abre desde la ficha y desde Mis reseñas; carga el libro y la reseña existente antes de permitir guardar. Un error de carga no se presenta como formulario nuevo.

`app/review/new.tsx` y `app/comments/[id].tsx` solo exportan sus pantallas, conforme a la arquitectura de rutas. `SpoilerText` se comparte entre ficha, feed, listas de reseñas y comentarios para que la protección sea la misma. `ConfirmDialog` aporta confirmación, cancelación y reintento al retirar reseñas/comentarios o descartar una edición. No se añaden aliases ni wrappers sin comportamiento.

## Reseñas y borradores

- El cuerpo se recorta en los extremos y requiere de 10 a 10 000 caracteres. El cliente y PostgreSQL validan los límites.
- Un índice único parcial impide dos reseñas activas del mismo usuario y libro. Una carrera entre editores produce un error visible en lugar de duplicar la reseña.
- Editar conserva el identificador; registra `edited_at`. Una publicación crea su actividad en la misma transacción y editar no produce otro evento.
- El borrador permanece ante un error de guardado o un refetch en segundo plano. El envío bloquea pulsaciones repetidas.
- El botón Cerrar pide confirmar si hay cambios sin guardar. El recorrido de gestos y botones del sistema debe verificarse en la compilación nativa antes del lanzamiento.
- Retirar una reseña requiere confirmación, no elimina la puntuación del libro y deja de exponer la reseña, su actividad y sus comentarios. Se puede escribir una nueva reseña después.
- Las mutaciones refrescan ficha, Mis reseñas, listas públicas de reseñas, perfil, contadores, feed y contexto de las conversaciones.

## Protección de spoilers

`SpoilerText` no monta el cuerpo del texto cuando está protegido. Esto lo retira también del árbol accesible, en lugar de ocultarlo solo con desenfoque o color. El lector debe pulsar **Mostrar spoiler** y puede volver a ocultarlo. Cambiar de contenido o editar la reseña vuelve a protegerlo, también cuando una lista recicla la tarjeta.

La protección se usa en el feed, la ficha del libro, Mis reseñas, las reseñas de un perfil y los comentarios. El contrato del feed conserva `contains_spoilers`; una reseña no publicada o eliminada no aporta texto de preview. La tarjeta que se exporta al compartir sustituye siempre un cuerpo marcado por un aviso, aunque el lector ya lo haya revelado en pantalla.

Una conversación que pertenece a una reseña con spoilers pide consentimiento antes de consultar o mostrar sus comentarios. Cada comentario puede marcarse además individualmente. Esta protección depende de las marcas elegidas por el autor: no intenta detectar spoilers automáticamente. Es un control de presentación; los cuerpos se reciben por API una vez autorizado el acceso al contenido.

Las notificaciones actuales de comentarios contienen referencias al contenido, no una copia del cuerpo. No se añade texto sensible a sus títulos ni previews.

## Comentarios y permisos

El hilo muestra carga, vacío, error con Reintentar y paginación con cursor compuesto `(created_at, id)`. Usa FlashList y los tokens del design system. Un fallo de envío conserva texto y marca de spoiler; no se limpia el campo hasta que el servidor confirma el éxito. Los comentarios propios se retiran con confirmación y admiten reintento.

El acceso al hilo se comprueba antes de habilitar el formulario. Un padre inexistente, eliminado o inaccesible muestra **Contenido no disponible**. Esta comprobación de UI acompaña la autorización del servidor; conocer el ID no da permiso.

Las políticas RLS exigen acceso al contenido padre tanto al leer como al crear comentarios. Se comprueban privacidad, seguidores aceptados, bloqueos y usuarios eliminados. El feed de una reseña también exige que siga publicada y visible. Las respuestas no pueden apuntar a comentarios de otro contenido ni los comentarios cambiar de propietario o hilo. La interfaz del MVP ofrece comentarios principales; no añade un editor de respuestas anidadas.

## Migraciones y borrado lógico

Se aplicaron y se regeneraron los tipos de Supabase:

- `20261020162508_reviews_comments_mvp.sql`: unicidad, validación, publicación, marca de spoilers y permisos heredados.
- `20261020163158_owned_content_soft_delete.sql`: operación de retirada restringida al propietario.

PostgreSQL no permite una actualización ordinaria que deje la fila fuera de su política de selección en este recorrido. `public.remove_own_content` es una entrada `SECURITY INVOKER`; delega la actualización en `lexa_social.remove_own_content`, una función `SECURITY DEFINER` de un esquema que debe mantenerse fuera de los esquemas expuestos por PostgREST. Exige `auth.uid()`, comprueba el propietario dentro de la actualización, acepta solo reseñas/comentarios y devuelve un booleano sin revelar cuerpos ni datos ajenos. El acceso anónimo está revocado y `search_path` permanece vacío.

Los contadores siguen calculándose mediante los triggers existentes, sin incrementos manuales desde el cliente. Las lecturas normales no muestran filas retiradas ni al propio autor.

Se comprobó que `lexa_social` no está expuesto por la Data API (`PGRST106`, esquema no válido). El análisis de seguridad no añadió avisos respecto de los que ya tenía el proyecto.

## Evidencia y límites

- `supabase/tests/reviews-comments.sql`: ejecución real con usuarios sintéticos, perfiles privados, seguidores pendientes/aceptados, bloqueos, duplicados, intervalos de visibilidad y borrado propio/ajeno. Termina con rollback.
- `src/__tests__/features/reviews/spoiler-text.test.tsx`: cuerpo ausente hasta revelar, ocultación tras cambios o reciclaje y tarjetas compartidas sin texto sensible.
- `scripts/check-reviews-preview.cjs`: navegador con el cliente real y HTTP simulado para verificar las cuatro vistas de reseñas, creación/edición/borrado, spoilers de hilo e individuales, borradores y errores recuperables. Incluye 320, 390 y 1280 px y modo oscuro. Guarda capturas en `.expo/reviews-preview`.
- TypeScript, ESLint, Prettier y comprobación de tokens del repositorio.

```powershell
pnpm exec expo start --web --port 8082
$env:LEXA_BROWSER_MODULES = 'ruta/absoluta/a/node_modules/con/playwright'
node scripts/check-reviews-preview.cjs
```

El origen se cambia con `LEXA_REVIEWS_PREVIEW_URL`. Las pruebas de navegador no envían comentarios ni reseñas reales. Pendientes antes de lanzar: teclado, áreas seguras, gestos de salida, accesibilidad nativa y exportación de la tarjeta en una compilación instalada de Android/iOS. Las notificaciones push no se marcan como verificadas por estas pruebas.
