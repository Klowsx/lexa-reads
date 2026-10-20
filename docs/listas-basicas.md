# Listas básicas

## Experiencia

El perfil abre las listas por su enlace estable. El detalle muestra portadas, nombre, descripción, visibilidad y libros en filas legibles. Usa BookCover, ConfirmDialog, los colores semánticos, las fuentes y los radios del design system en claro y oscuro. Se retiran el degradado, los controles de cristal, los colores locales y las franjas decorativas. Las acciones principales tienen objetivos táctiles de 48 px y foco visible.

Crear y editar comparten formulario: nombre de 2 a 60 caracteres, descripción opcional de hasta 200 y visibilidad. Las listas nuevas empiezan privadas. Una lista pública respeta además la privacidad de la cuenta; el formulario lo explica. Renombrar no cambia el slug. Un fallo mantiene el borrador y la acción de volver/cancelar pide confirmación si hay cambios. La confirmación cubre los controles de la pantalla; el historial del navegador y los gestos de navegación nativos requieren validación adicional.

El propietario puede buscar y añadir libros desde el propio detalle, sin abandonar la lista. Se reutiliza la búsqueda existente y su caché de libros. Los libros añadidos se indican con una marca y no se duplican. Quitar un libro requiere confirmación y solo elimina su relación con la lista, no el libro ni su registro de lectura. El título abre su ficha y «Registrar lectura» mantiene disponible el editor compartido.

Desde la ficha de un libro, el selector consulta su pertenencia real. Marcar añade; desmarcar quita. La selección persiste al recargar y los errores permiten reintentar. Crear una lista desde este selector conserva el contexto del libro y vuelve al selector para elegirla.

Eliminar una lista utiliza la confirmación compartida con estado de espera y error. Los estados vacíos enseñan la siguiente acción, los errores de consulta ofrecen reintento y una lista inexistente o inaccesible muestra un mensaje explícito. El editor rechaza URLs de listas ajenas.

## Datos y permisos

- Se mantienen las políticas RLS existentes: solo el propietario crea y modifica sus listas y sus libros; la lectura pública respeta cuenta privada, seguidores aceptados y bloqueos.
- `20261020215902_basic_lists_mvp.sql` añade límites de nombre/descripción y `add_list_book`. El RPC es SECURITY INVOKER, usa search_path vacío y solo se concede a authenticated. Verifica propiedad, bloquea la fila de lista durante la incorporación, calcula la siguiente posición desde el máximo y usa la restricción única para evitar duplicados. No confía en el contador como posición.
- Los triggers existentes mantienen books_count. El cliente no escribe contadores.
- `20261020220617_restore_list_metadata.sql` recupera is_featured y accent_color: existían en la migración histórica 009 y en el cliente, pero faltaban en la base desplegada. Se regeneraron los tipos y se retiraron casts de las consultas modificadas que ocultaban esa discrepancia.
- Las escrituras refrescan detalle, selector, portadas y contadores del perfil mediante claves derivadas de las factorías. El detalle separa la caché por lector y revalida permisos al regresar. El estado de «me gusta» se obtiene del servidor.
- Las consultas de colecciones mantienen el alcance básico existente; esta entrega no incorpora reordenación manual, listas colaborativas ni navegación incremental para grandes colecciones. La API conserva su límite de filas configurado. FlashList virtualiza la presentación.

## Organización

Las rutas de app/ solo reexportan las pantallas de src/features/lists/screens, como exige CLAUDE.md. Crear y editar usan la misma pantalla y formulario para compartir comportamiento y validación. ListControls comparte cabecera, acciones con estado/foco y skeleton entre las tres pantallas. No hay wrappers de un solo consumidor para acortar archivos.

## Verificación

- `supabase/tests/basic-lists.sql`, ejecutado contra Supabase y revertido: crear, editar, límites, destacar, alta idempotente, orden después de una retirada, contadores, protección de escrituras ajenas, visibilidad privada y borrado en cascada que conserva el catálogo.
- `supabase/tests/profile-privacy.sql`: regresión real de acceso por privacidad, seguimiento y bloqueo.
- Consultas HTTP a la API real: selección de campos y relaciones de lists, list_books y list_likes responde correctamente, incluidos los campos recuperados.
- `scripts/check-lists-preview.cjs`: cliente real con transporte HTTP simulado. Creación y edición, errores de guardado/alta/retirada/eliminación, selección tras recargar, creación desde el libro, descarte de borrador, editor ajeno, consulta fallida con reintento, lista no disponible, vacíos y anchos 320/390/1280 px en claro/oscuro.
- `scripts/check-reading-preview.cjs`: regresión del registro de lectura desde búsqueda, biblioteca, feed y listas, además de ficha y meta anual.
- TypeScript, lint, formato del código modificado, tokens y 48 pruebas unitarias/de componentes. Las cuatro suites antiguas que requieren credenciales en .env.test siguen excluidas; las pruebas de permisos anteriores se ejecutan en la base real.
- Los advisors no señalan la nueva función; permanecen los avisos anteriores del proyecto.

Pendiente antes de lanzamiento: compilación instalada en Android/iOS, teclado y navegación nativa, VoiceOver/TalkBack y tamaños de fuente ampliados en dispositivos.
