# Perfiles, seguimiento y privacidad

## Experiencia del lector

El perfil propio y el ajeno comparten identidad, avatar, tipografía editorial y contadores. Se elimina el degradado del perfil ajeno y la tarjeta que encerraba toda la identidad propia. Las lecturas y listas mantienen los componentes del design system; los controles tienen estados de carga, error, foco y áreas táctiles adecuadas. La comunidad se adapta al ancho disponible y conserva el estado real de seguimiento, incluida la ausencia de una acción para seguirse a uno mismo.

La edición del perfil permite cambiar nombre, biografía, géneros y cuenta privada. Si falla el guardado, mantiene el formulario y permite reintentar. Las solicitudes recibidas aparecen en el perfil propio: aceptar concede acceso y rechazar retira la solicitud sin incrementar los contadores ni notificar al solicitante.

El perfil de otra persona distingue entre seguir, solicitar seguimiento, cancelar solicitud y dejar de seguir. Esta última acción requiere confirmación e informa sobre la pérdida de acceso si la cuenta es privada. Las listas del lector se consultan realmente y abren su `slug`; ya no se renderiza una colección vacía fija. Los errores y perfiles no disponibles tienen un estado explícito.

## Contrato de privacidad

- La identidad pública incluye nombre, usuario, avatar, biografía, géneros y contadores. Una cuenta privada reserva sus registros de lectura, reseñas publicadas, listas públicas y relaciones de comunidad al propietario y a seguidores aceptados. Las listas individuales privadas siguen siendo exclusivas de su propietario.
- El servidor obtiene la privacidad actual del destinatario. Insertar `accepted` desde un cliente modificado contra una cuenta privada produce `pending`. El cliente no puede aprobar su propia solicitud, cambiar los participantes ni alterar la fecha de creación.
- Solo el destinatario puede cambiar una solicitud pendiente a aceptada. El servidor establece `accepted_at`. Ambos participantes pueden retirar la relación: el solicitante cancela o deja de seguir, y el destinatario rechaza o retira un seguidor.
- Los contadores incluyen únicamente relaciones aceptadas. La migración corrige los totales anteriores; los triggers mantienen inserciones, aprobaciones y retiradas sin escrituras manuales desde frontend.
- Hacer privada una cuenta conserva a sus seguidores ya aceptados. Hacerla pública abre su contenido público; no aprueba silenciosamente las solicitudes pendientes. Volver a privada vuelve a exigir una relación aceptada.
- Bloquear elimina seguimientos en ambos sentidos. Desbloquear no los restaura. Las solicitudes pendientes no son visibles a terceros; las relaciones aceptadas respetan los permisos de ambos perfiles.
- Perfiles inexistentes o eliminados no conceden acceso por ausencia de una fila. Los bloqueos se comprueban en ambos sentidos. Las políticas de listas protegen también sus libros mediante las políticas existentes del padre. Reseñas, comentarios y actividad conservan sus comprobaciones de privacidad.

La migración `20261020204044_profile_follow_privacy_mvp.sql` se aplicó en Supabase. Los métodos privilegiados permanecen en el esquema no expuesto `lexa_social`, con `search_path` vacío y ejecución directa revocada para los triggers. `public.can_view_user_content` es un invocador de la comprobación privada, evitando recursión entre políticas.

## Caché y carga

La UI espera una relación aceptada confirmada por servidor antes de consultar contenido protegido. Revalida el perfil al montarlo y al volver a la pantalla. Mientras comprueba acceso a una cuenta privada, oculta su contenido anterior. Seguir, cancelar, responder, bloquear o cambiar privacidad refresca perfiles, contadores y comunidad y descarta el contenido dependiente de permisos en caché. El optimismo de una nueva solicitud nunca concede por sí solo acceso privado.

Seguidores y seguidos usan FlashList y cursor `(created_at, id)`, con 30 filas visibles y una adicional para detectar continuación. Se consulta solamente la pestaña activa. Un fallo de página adicional conserva las filas cargadas y permite reintentar.

Las tres pantallas modificadas viven en `src/features/user/screens/`; `app/` conserva sus rutas de Expo Router. `FollowButton` se comparte entre perfil y `UserCard`, usado en búsqueda y comunidad. `profile-cache.ts` concentra la invalidación que necesitan seguimiento, solicitudes, bloqueos y edición de privacidad. No se añaden intermediarios de presentación de un solo uso.

## Verificación y límites

- `supabase/tests/profile-privacy.sql`, ejecutado contra Supabase con `ROLLBACK`: aceptación forzada, identidad inmutable, aprobación legítima, rechazo, retirada, contadores, cuentas públicas/privadas, bloqueo y desbloqueo, anonimato, listas y libros protegidos, y 37 seguidores con fechas empatadas repartidos en dos páginas sin omisiones ni duplicados.
- `supabase/tests/reviews-comments.sql`, vuelto a ejecutar con relaciones creadas mediante el flujo autorizado: privacidad, bloqueos, comentarios y eliminación conservan sus garantías.
- `scripts/check-profile-preview.cjs`: cliente real en navegador con HTTP simulado. Comprueba ausencia de consultas protegidas antes de aprobar, errores con reintento, persistencia de solicitudes al recargar, cancelación, confirmación al dejar de seguir, revocación de acceso al volver desde otra pantalla, aceptación/rechazo, edición con error, perfiles no disponibles y anchos de 320/390/1280 px en claro/oscuro.
- Los recorridos anteriores de registro de lectura y reseñas/comentarios continúan aprobados. TypeScript, lint, formato y 48 pruebas unitarias/de componentes verificados. Las cuatro suites de integración antiguas que necesitan credenciales en `.env.test` permanecen fuera de esta ejecución; la seguridad específica se verificó con los dos scripts SQL reales anteriores.
- Los avisos de seguridad de Supabase no identifican nuevos hallazgos para las funciones añadidas. Persisten los avisos previos del proyecto, fuera de este punto del MVP.

Pendiente de lanzamiento: compilación instalada en Android/iOS, VoiceOver/TalkBack, escalado de fuente, teclado y navegación nativa. Este punto no marca como completos el feed, notificaciones push ni todo el módulo de bloqueo/reporte y gestión de cuenta, que siguen teniendo sus propios puntos del MVP.
