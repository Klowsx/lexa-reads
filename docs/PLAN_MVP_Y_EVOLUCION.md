# Lexa Reads: auditoría, MVP y plan de evolución

Fecha: 15 de octubre de 2026.

Estado del documento: propuesta de trabajo basada en el repositorio actual. No se han implementado correcciones ni modificado la base de datos como parte de esta revisión.

**Seguimiento actualizado el 20 de octubre de 2026:** la auditoría anterior se conserva como diagnóstico del 15 de octubre. La lista de «Dentro del MVP» y las notas de estado posteriores reflejan las implementaciones verificadas desde entonces; no significan que todo el lanzamiento esté validado en dispositivos físicos.

## 1. Conclusión ejecutiva

Lexa ya tiene una base considerable: biblioteca, fichas de libros, reseñas, feed, perfiles, listas, notificaciones y código para clubes y mensajes. La arquitectura por funcionalidades, los hooks de datos y varias optimizaciones existentes permiten seguir construyendo sin empezar de nuevo.

Sin embargo, **todavía no recomendaría un lanzamiento público**. Hay recorridos centrales incompletos, controles que aparentan guardar sin persistir y riesgos de permisos que deben resolverse o descartarse mediante pruebas directas. Tener una pantalla construida no equivale a tener una funcionalidad lista para producción.

La prioridad recomendada es terminar bien este recorrido:

> Crear una cuenta → encontrar un libro → guardarlo en la biblioteca → registrar una lectura o reseña → descubrir actividad relevante → regresar y encontrar los datos correctos.

El MVP debería concentrarse en lectura personal y comunidad básica. Clubes y mensajería pueden conservarse, pero su activación debe depender de pruebas de seguridad, moderación y funcionamiento. Ocultar una pantalla no protege sus tablas ni sus APIs.

Orden de trabajo propuesto:

1. Estabilizar dependencias, migraciones y permisos.
2. Completar onboarding, persistencia y consistencia de los datos de lectura.
3. Corregir errores, spoilers, accesibilidad y estados vacíos.
4. Medir rendimiento, preparar operación y hacer una beta controlada.
5. Ampliar retención y comunidad según el uso real.

No asigno un porcentaje de avance: sin validar los recorridos autenticados y el estado desplegado, dar una cifra sería engañoso.

## 2. Alcance, evidencia y límites

Se revisaron rutas, componentes, hooks, consultas, políticas SQL, funciones de Supabase, configuración, pruebas y documentación. Los criterios de UX/UI y rendimiento se apoyan en las skills Impeccable, Web Design Guidelines, React Native y Supabase, adaptándolos al contexto móvil. No se propone una reconstrucción visual ni un cambio de tecnología.

### Comprobaciones ejecutadas

| Comprobación                                     | Resultado                                                                                         | Interpretación                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Node y pnpm locales                              | Node 24.15.0 y pnpm 10.33.2                                                                       | La versión local de Node ya no coincide con la versión antigua del error compartido anteriormente.                                       |
| TypeScript: `pnpm exec tsc --noEmit`             | Correcto                                                                                          | El código incluido en esta configuración pasa tipos. Las funciones de Supabase están excluidas.                                          |
| Compatibilidad: `pnpm exec expo install --check` | Falló: 11 dependencias fuera del rango esperado                                                   | Hay que alinear el proyecto con su SDK antes de confiar en una compilación nativa.                                                       |
| Pruebas: `pnpm exec jest --runInBand`            | 1 suite pasó; 4 fallaron al inicializarse                                                         | Pasaron 3 pruebas del store de autenticación. Las otras suites no llegaron a comprobar sus casos por falta de configuración de Supabase. |
| Exportación web de Expo                          | Correcta                                                                                          | La exportación compila; no prueba el comportamiento nativo ni los flujos autenticados.                                                   |
| Tamaño de la exportación                         | JS principal: 4,61 MB sin comprimir; CSS: 22,2 kB; 30 fuentes: 3,29 MB; total aproximado: 7,97 MB | Es una referencia de peso del artefacto web, no del APK/IPA ni del tráfico inicial efectivo.                                             |
| Tiempo de Metro en esa exportación               | 36,7 segundos                                                                                     | Es tiempo de compilación, no tiempo de respuesta de la aplicación.                                                                       |
| Contraste de colores                             | Calculado sobre los valores del tema                                                              | Hay combinaciones insuficientes para texto normal; se detallan más adelante.                                                             |

La exportación quedó en `.expo/audit-web`, una carpeta ignorada por Git. El servidor temporal usado para intentar inspeccionarla se detuvo.

### Lo que no se ha validado

- No se consultaron los permisos efectivos, datos, índices, logs ni migraciones aplicadas del proyecto remoto de Supabase.
- No se ejecutaron pruebas de escritura sobre una base de datos real ni pruebas de carga.
- No se midieron latencias reales, uso de memoria, FPS, consumo de batería ni tiempos de arranque en Android/iOS.
- No se completaron registro, lectura, eliminación de cuenta o notificaciones push en dispositivos.
- La apertura de Chrome para capturar la interfaz fue rechazada por la política automática de aprobación. No hay capturas verificadas ni una evaluación visual integral del producto ejecutándose.
- No se validaron los sitios públicos de soporte, privacidad o eliminación de cuenta, ni la configuración de correo y redirecciones del proyecto remoto.

Por ello, las observaciones visuales son de estructura, estilos y comportamiento observable en el código. Los hallazgos de seguridad describen riesgos del SQL disponible; no afirman que se haya explotado una vulnerabilidad en producción.

## 3. Qué ya conviene conservar

- Separación por funcionalidades, consultas y hooks: una buena base para corregir sin reescribir.
- React Query y actualizaciones optimistas en varias operaciones.
- FlashList en pantallas de contenido y uso de `expo-image` para imágenes.
- Paginación por cursor compuesto en varios recorridos de feed, reseñas y mensajes.
- Caché local de libros antes de acudir a un proveedor externo.
- Componentes de skeleton, estados de consulta y límites de error.
- Validación de contenido y límites de longitud en parte del cliente y servidor.
- Intención de seguridad mediante RLS, bloqueo, reportes y preferencias de privacidad.
- Implementación inicial de exportación y eliminación de cuentas.
- Identidad visual editorial cálida: puede mantenerse, corrigiendo contraste y consistencia.

La inversión más rentable ahora es conectar, proteger y verificar lo existente, no añadir muchas pantallas nuevas.

## 4. Inventario funcional

| Área                                                  | Situación observada                                                                    | Decisión recomendada                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Registro, acceso y recuperación                       | Implementados parcialmente; falta verificar confirmaciones y enlaces reales            | MVP obligatorio.                                        |
| Onboarding                                            | Pantallas construidas, finalización y persistencia incompletas                         | Bloqueador del recorrido inicial.                       |
| Búsqueda y ficha de libro                             | Base funcional; errores poco claros y dependencia de proveedores                       | MVP obligatorio con estados y fallback.                 |
| Biblioteca y estados de lectura                       | Hay consultas y mutaciones, pero las hojas rápidas mantienen cambios locales           | Unificar antes de beta.                                 |
| Puntuaciones y reseñas                                | Implementadas; interacción inconsistente y spoilers no protegidos en todo el recorrido | MVP obligatorio.                                        |
| Fechas, etiquetas y meta anual                        | Modelo/parcialidades presentes; flujo de edición incompleto                            | Completar lo mínimo o retirar lo que no funcione.       |
| Feed, seguidores y perfiles                           | Construidos; privacidad y arranque sin contactos necesitan trabajo                     | Comunidad básica del MVP.                               |
| Listas                                                | Construidas; revisar ordenamiento y carga de portadas                                  | Mantener listas básicas si no retrasa los bloqueadores. |
| Notificaciones                                        | Base existente; tipos recientes y navegación incompletos                               | Solo eventos completamente soportados.                  |
| Bloqueo, reportes, eliminación y exportación          | Código presente, no validación integral                                                | Requisito de salida, no funcionalidad futura.           |
| Clubes y mensajes                                     | Ya hay implementación, aunque la documentación los sitúa después                       | Activación posterior a pruebas específicas.             |
| Estadísticas, importación y recomendaciones avanzadas | Ausentes o parciales                                                                   | Priorizar después de validar retención.                 |
| Operación, métricas y automatización de calidad       | Insuficientes para un lanzamiento confiable                                            | Parte del trabajo del MVP.                              |

## 5. Definición de MVP propuesta

Esta es una propuesta de alcance, no un cambio ya aprobado del producto descrito en `CLAUDE.md` y `docs/STACK.md`.

### Dentro del MVP

El MVP incluye acceso por correo, onboarding corto, biblioteca, estados de
lectura, puntuaciones, reseñas con spoilers, perfiles, seguimiento, privacidad y
listas básicas. La búsqueda debe admitir título, autor e ISBN con una alternativa
cuando falte portada o catálogo. El feed necesita un estado útil para personas
sin contactos y las notificaciones solo se activan para eventos probados de punta
a punta.

Bloqueo, reportes, exportación y eliminación de cuenta son requisitos de salida,
con sus criterios en [el plan de seguridad y datos](plan-seguridad-y-datos-de-cuenta.md).
La accesibilidad, los errores visibles, los controles operativos, la publicación
legal y una versión instalable también forman parte de ese requisito de salida.
El estado de cada entrega se mantiene en [Pendientes](pendientes.md).

Para este último punto, consultar [implementación, comprobaciones y bloqueos de
publicación](verificacion-accesibilidad-y-publicacion.md). Sigue abierto hasta
verificar los documentos públicos y la APK instalada en Android.

Los puntos marcados corresponden a implementación y comprobaciones automatizadas realizadas. Evidencia y límites:

- **Acceso y onboarding:** [documentación del flujo](#acceso-por-correo-y-onboarding), pruebas unitarias, navegador con HTTP simulado y prueba SQL transaccional. Pendientes de lanzamiento: entrega real del correo, enlaces y reanudación en una compilación instalada.
- **Estados, puntuación y fechas:** [registro de lectura](#registro-de-lectura), RPC y RLS verificadas en Supabase, pruebas unitarias y recorrido de las entradas con navegador. Pendiente: teclado y áreas seguras en Android/iOS instalado.
- **Reseñas, spoilers y comentarios:** se mantienen en el MVP. [Contrato y pruebas](#reseñas-spoilers-y-comentarios): crear, editar y retirar reseñas; spoilers ocultos también en previews y tarjetas compartidas; comentarios con su propia marca de spoiler, permisos heredados del padre, errores recuperables y confirmación al eliminar. Verificado con SQL real, pruebas de componentes y navegador. Pendiente: recorrido y exportación nativa de tarjetas en una compilación instalada.
- **Biblioteca:** [contrato y comprobaciones](#biblioteca-personal): filtros combinables por estado, título/autor, puntuación y etiquetas; páginas por cursor de 24 libros; totales independientes; vacíos específicos y errores recuperables sin perder lo cargado. Verificado con SQL real y navegador. Pendiente: recorrido instalado y gestos nativos en Android/iOS.
- **Perfiles, seguimiento y privacidad:** [contrato y pruebas](#perfiles-seguimiento-y-privacidad): perfil propio/ajeno coherente, edición y privacidad, solicitudes recibidas operativas, relaciones decididas por servidor, contadores de aceptados, listas y comunidad protegidas, y revalidación de caché al perder acceso. Verificado con SQL real, navegador y regresiones de lectura/reseñas. Pendiente: recorrido instalado y accesibilidad con lectores de pantalla nativos.
- La búsqueda recibió mejoras de UI/UX, pero el punto completo continúa abierto hasta verificar expresamente título, autor e ISBN.
- **Listas básicas:** [contrato y comprobaciones](#listas-básicas): formulario compartido de creación/edición, búsqueda dentro de la lista, selector persistente desde el libro, incorporación sin duplicados, retiradas y eliminación con errores recuperables. UI alineada con el design system, permisos y contadores verificados en Supabase; flujo y presentación comprobados en navegador. Pendiente: recorrido instalado, navegación y accesibilidad nativas.

### Opcional para la primera beta, con decisión explícita

- Acceso con Google: está en el alcance documentado, pero se puede posponer si el acceso por correo funciona bien. Si se añade en iOS, revisar las condiciones de la regla 4.8 sobre alternativas equivalentes de acceso; no asumir que Google por sí solo cumple todos los casos.
- Escáner de código de barras: útil, pero menos urgente que una búsqueda y un guardado confiables.
- Etiquetas: completar una edición sencilla o esconder temporalmente los filtros que el usuario no puede alimentar.
- Compartir tarjetas: conservar si las dependencias nativas y los permisos están probados.
- Recomendaciones iniciales: selección editorial real y relevante en español antes que personalización compleja.

### Fuera del MVP recomendado

- Clubes y mensajes abiertos a todos, hasta cerrar sus riesgos específicos.
- Recomendaciones con IA, lectura acompañada, retos complejos y rankings.
- Suscripciones, anuncios, personalización de pago y gamificación extensa.
- Sincronización completa sin conexión, aplicación web pública completa y expansión de idiomas.

Una beta puede tener menos funcionalidades; no debería tener menos integridad de datos o privacidad.

## 6. Hallazgos prioritarios

Prioridades:

- **P0:** bloquea el recorrido central o supone un riesgo de acceso/datos que debe corregirse o descartarse antes de exponerlo.
- **P1:** necesario para una beta confiable y el lanzamiento del MVP.
- **P2:** mejora posterior, salvo que las mediciones o el uso eleven su prioridad.

Esfuerzo orientativo por tarea: S = menos de 1 día; M = 1–3 días; L = 3–5 días; XL = dividir en entregas. Son estimaciones de desarrollo, no compromisos ni tiempos de revisión externa. Varias tareas se solapan; no deben sumarse mecánicamente.

### A. Bloqueadores y seguridad

#### A01 · P0 · Finalización real del onboarding · M

**Evidencia:** `app/(auth)/onboarding/username.tsx` muestra un nombre predefinido y considera disponible un valor por su longitud. El botón «Entrar a Lexa» no tiene una acción de finalización. Géneros y meta se conservan localmente en sus pantallas. `app/_layout.tsx` usa `onboardingStarted`, un estado transitorio, para el control de acceso.

**Impacto:** el usuario puede completar visualmente el recorrido sin guardar sus preferencias ni cerrar correctamente el onboarding. Reiniciar la aplicación puede producir un comportamiento distinto.

**Acción:** persistir los pasos necesarios, comprobar disponibilidad con una restricción única en servidor, resolver conflictos concurrentes y basar la reanudación en el perfil persistido. Quitar valores personales de ejemplo y calcular el año actual.

**Aceptación:** registrarse, avanzar, cerrar y reabrir permite retomar; finalizar guarda los datos y entra en la aplicación. Dos cuentas no pueden reservar el mismo nombre. Se prueban registro con y sin sesión inmediata tras confirmar correo.

#### A02 · P0 · Guardados aparentes en hojas de libro · M

**Evidencia:** `BookDetailSheet.tsx` y `QuickPeekSheet.tsx`, en `src/features/book/components/`, cambian estado y puntuación mediante estado local. La primera incluye cifras literales y una entrada para escribir reseña sin acción. La biblioteca no le pasa un registro personal completo.

**Impacto:** el usuario cree que guardó un libro o puntuación y pierde el cambio al volver a abrirlo.

**Acción:** compartir las mismas mutaciones y reglas de dominio entre ficha, biblioteca y hojas rápidas. Mostrar datos reales, carga, error y confirmación; retirar cifras de demostración.

**Aceptación:** cada entrada produce el mismo resultado persistido después de recargar o iniciar otra sesión. Un fallo no presenta éxito y permite reintentar.

#### A03 · P0 de publicación · Compatibilidad del proyecto nativo · M

**Evidencia:** el chequeo de Expo detectó estos desajustes para el SDK instalado:

| Paquete                | Instalado | Esperado por el chequeo |
| ---------------------- | --------- | ----------------------- |
| expo                   | 54.0.34   | ~54.0.37                |
| expo-constants         | 18.0.13   | ~18.0.14                |
| expo-device            | 56.0.4    | ~8.0.10                 |
| expo-font              | 14.0.11   | ~14.0.12                |
| expo-linear-gradient   | 56.0.4    | ~15.0.8                 |
| expo-localization      | 17.0.8    | ~17.0.9                 |
| expo-notifications     | 56.0.15   | ~0.32.17                |
| expo-router            | 6.0.23    | ~6.0.24                 |
| expo-sharing           | 56.0.15   | ~14.0.8                 |
| react-native-view-shot | 5.1.0     | 4.0.3                   |
| jest-expo              | 55.0.17   | ~54.0.18                |

**Acción:** elegir y mantener una combinación soportada, sin actualizar todo a la última versión indiscriminadamente. Alinear Node de desarrollo y EAS: `eas.json` conserva Node 20.18.0, mientras el entorno local ya usa 24.15.0 y existen dependencias con requisitos superiores. Revisar también el cliente de desarrollo requerido por la configuración.

**Aceptación:** instalación reproducible desde el lockfile, chequeo de Expo correcto y builds de Android/iOS probados. Verificar especialmente notificaciones, compartir y captura de tarjetas. La exportación web correcta no sustituye estas comprobaciones.

#### A04 · P0 · Migraciones reproducibles · L

**Evidencia:** los archivos `012_books_insert_hardening.sql`, `013_account_hard_delete.sql`, `014_privacy_and_blocks.sql` y `015_reports_moderation.sql` terminan con `</content>` fuera de un comentario. Hay dos archivos con prefijo `011`. No se encontró `supabase/config.toml`.

**Impacto:** el historial no ofrece una creación limpia y reproducible de la base. No permite deducir con confianza qué está desplegado.

**Acción:** contrastar historial remoto y local; corregir los archivos inválidos y diseñar una reconciliación segura. No renombrar ni volver a aplicar ciegamente migraciones ya desplegadas. Preparar entorno desechable y procedimiento de restauración.

**Aceptación:** una base vacía puede aplicar el historial previsto; una copia representativa puede actualizarse sin perder datos. Quedan documentados esquema, extensiones, secretos, funciones, trabajos programados y orden de despliegue.

#### A05 · P0 · Aprobación de seguidores de cuentas privadas · L

**Estado al 20 de octubre: resuelto en servidor y cliente.** El servidor normaliza solicitudes privadas a `pending`, solo el destinatario puede aprobar, la identidad es inmutable y las listas/comunidad respetan la privacidad. Los contadores incluyen únicamente aceptados. SQL real comprueba los permisos y navegador recorre solicitudes, errores, cancelación y pérdida de acceso. Ver [evidencia y límites](#perfiles-seguimiento-y-privacidad). La evidencia siguiente describe el estado anterior.

**Evidencia:** en `001_initial_schema.sql` la inserción de seguimientos comprueba la identidad del seguidor y el estado tiene valor predeterminado `accepted`. En `src/features/user/user.queries.ts` es el cliente quien elige `pending` o `accepted`. Las políticas de `014_privacy_and_blocks.sql` confían en ese estado. No se encontró una normalización de servidor que obligue a solicitar aprobación para una cuenta privada, ni una política UPDATE que explique el flujo legítimo de aceptación.

**Riesgo a validar:** un cliente modificado podría crear un seguimiento ya aceptado. El flujo legítimo de aprobación también puede fallar según los permisos desplegados.

**Acción:** controlar en servidor el estado inicial y sus transiciones; solo el destinatario puede aprobar una solicitud. Proteger la identidad de ambos participantes y revisar cambios entre cuenta pública y privada.

**Aceptación:** pruebas directas contra la API rechazan la aceptación forzada; pendiente, rechazado y bloqueado no ven contenido privado; el destinatario sí puede aceptar y revocar conforme a la política del producto.

#### A06 · P0 · Permisos de columnas privilegiadas · L

**Evidencia:** `017_privilege_and_search_path_hardening.sql` revoca UPDATE sobre columnas como `is_admin`, contadores y campos de eliminación. `020_messaging.sql` utiliza un patrón relacionado para roles. No se encontró una revocación general equivalente que permita asegurar la eliminación de permisos más amplios.

**Riesgo condicionado:** revocar un permiso de columna no elimina un permiso de tabla que siga concedido. El riesgo depende de los privilegios efectivos del proyecto, incluidos los heredados mediante PUBLIC.

**Acción:** inspeccionar ACL efectivas; revocar permisos amplios donde corresponda y conceder únicamente las columnas editables o RPC autorizadas. Revisar funciones con privilegios elevados y quién puede ejecutarlas.

**Aceptación:** un usuario común no puede elevar su rol, alterar contadores ni controlar estados internos aunque llame directamente a la API. Los campos legítimos del perfil siguen siendo editables.

#### A07 · P0 si el esquema está expuesto · Rol de propietario en clubes · L

**Evidencia:** `020_messaging.sql`, función `set_club_member_state`, acepta `NEW.role = 'owner'` y activa la membresía antes de validar que el usuario sea el creador. La política INSERT permite insertar la membresía propia; el rol es un campo de texto. Existe además un trigger específico para crear al propietario legítimo.

**Riesgo a validar:** insertar una membresía propia con rol de propietario en un club ajeno, si esos permisos están desplegados.

**Acción:** asignar roles privilegiados exclusivamente mediante operaciones de servidor autorizadas. Definir restricciones para roles y transiciones. La inserción normal debe producir un miembro ordinario, no un propietario.

**Aceptación:** matrices de pruebas cubren extraño, solicitante, miembro, moderador y propietario. No se puede autoconceder autoridad. Desactivar la UI no se considera una corrección de este riesgo.

#### A08 · P0 de privacidad · Eliminación y sesiones · M/L

**Evidencia:** `supabase/functions/delete-account/index.ts` llama `admin.signOut(user.id)`, pero esa operación espera el JWT de una sesión. Su error no condiciona la respuesta de éxito. `useAccountDeletion.ts` limpia el estado local de sesión sin una llamada equivalente a `supabase.auth.signOut()`.

**Acción:** revisar el flujo completo: autorización, eliminación solicitada, revocación con la credencial correcta, limpieza del almacenamiento local, acceso durante el periodo de espera y ejecución final. Definir el tratamiento de tokens ya emitidos y archivos de Storage.

**Aceptación:** después de solicitar eliminación, el comportamiento real coincide con el aviso al usuario; no se restaura una sesión residual al reiniciar. Se prueban fallos de revocación, recuperación permitida o no, y borrado final en un entorno aislado.

#### A09 · P0 de salida · Pruebas de privacidad todavía no ejecutables · L

**Evidencia:** `src/test-utils/supabase.ts` construye clientes al importar el módulo; varias suites lo importan antes de aplicar su condición de omisión. Sin las variables de prueba fallan con `supabaseUrl is required`, en vez de ejecutarse o quedar omitidas correctamente.

**Acción:** separar pruebas unitarias de integración, inicializar clientes solo cuando corresponda y configurar una base de pruebas desechable. Las claves administrativas deben existir únicamente en el entorno de pruebas autorizado, nunca en la app.

**Aceptación:** pruebas unitarias funcionan sin servicios externos; integración se ejecuta de forma explícita y limpia sus datos. La pipeline no presenta pruebas omitidas como seguridad comprobada. No se utilizan cuentas o datos de producción.

### B. UX, confianza y consistencia funcional

#### B01 · P1 · Errores y confirmaciones visibles · M

`src/stores/ui.store.ts` almacena toasts y `src/lib/query-client.ts` los añade, pero no se encontró un componente que consuma y dibuje esa cola. Además, ciertos callbacks locales de error reemplazan el comportamiento predeterminado de las mutaciones.

Implementar un canal visible y accesible de feedback, diferenciar errores recuperables y evitar mensajes duplicados. Revisar si un manejador global de `MutationCache` es más adecuado para el comportamiento común. Aceptación: un guardado rechazado se anuncia, conserva lo escrito y ofrece una salida clara.

#### B02 · P1 · Spoilers en el feed · M

**Estado al 20 de octubre: resuelto en el recorrido de reseñas del MVP.** Se conserva y consume `contains_spoilers` en el feed, con revelado explícito en todas las vistas de reseñas y comentarios. Las tarjetas compartidas sustituyen el cuerpo sensible; las notificaciones actuales de comentarios guardan referencias, sin copiar ese cuerpo. Ver [evidencia](#reseñas-spoilers-y-comentarios).

`src/features/feed/feed.queries.ts` trae el cuerpo de la reseña, pero no el indicador necesario para proteger spoilers; `FeedCard.tsx` lo muestra directamente. Extender el contrato y aplicar el mismo tratamiento que en la ficha. Aceptación: un spoiler está oculto por defecto en todas las vistas, incluidas previews y notificaciones que contengan texto.

#### B03 · P1 · Cambiar estado no debería borrar por sorpresa · M

**Estado al 20 de octubre: resuelto.** Elegir el estado activo no elimina el registro; los controles compartidos permiten medias estrellas y una retirada explícita de puntuación. Ver [registro de lectura](#registro-de-lectura).

En `app/book/[id].tsx`, pulsar el estado ya seleccionado elimina el registro de biblioteca. Separar «cambiar estado» de «quitar de mi biblioteca» y explicar qué ocurre con puntuación, etiquetas y fechas. Usar confirmación o deshacer verificable para la acción destructiva. Unificar además medios puntos, retirada de puntuación y selección de estrellas entre componentes.

#### B04 · P1 · Fechas y meta anual coherentes · M/L

**Estado al 20 de octubre: resuelto.** Se proponen fechas al comenzar/finalizar, se pueden corregir y el contador anual se sincroniza por `finished_at`. Las lecturas antiguas sin fecha conservan esa ausencia. Ver [registro de lectura](#registro-de-lectura).

La meta cuenta libros mediante `finished_at`, pero las acciones habituales de estado no proporcionan esa fecha y no se encontró un flujo completo que la mantenga. Establecer reglas explícitas: sugerir hoy al terminar, permitir corregir fechas históricas y definir qué pasa al reabrir una lectura. Invalidar biblioteca, meta, perfil y actividad relevante después de guardar. Aceptación: marcar un libro como leído actualiza la meta según el año y la fecha elegida, sin duplicar lecturas.

#### B05 · P1 · Controles sin efecto y contenido de demostración · M

`BookSimilarTab.tsx` muestra cinco libros y puntuaciones fijos sin depender del libro actual. `GenreChips.tsx` contiene elementos pulsables sin acción y el histograma de `BookReviewsTab.tsx` tiene un callback vacío. El lápiz del avatar del onboarding tampoco completa una edición.

Hacer que cada control cumpla su promesa o presentarlo como información no interactiva. Ocultar recomendaciones ficticias hasta tener una selección real; no hace falta IA para resolverlo. No se consideran errores los callbacks vacíos usados deliberadamente para detener la propagación de un toque.

#### B06 · P1 · Error de búsqueda distinto de cero resultados · M

`src/lib/google-books.ts` transforma determinadas respuestas fallidas en `null` o listas vacías. La pantalla no ofrece un tratamiento suficiente de errores. Distinguir consulta sin coincidencias, falta de conexión, cuota agotada y proveedor no disponible. Mantener resultados anteriores cuando ayude, ofrecer reintento y explicar qué puede buscarse.

#### B07 · P1 · Arranque recuperable · M

`app/_layout.tsx` espera sesión y fuentes y devuelve `null` durante la espera. Falta un tratamiento explícito de rechazo de `getSession` y errores de carga tipográfica. Añadir pantalla de arranque visible, timeout razonable, tipografía alternativa y recuperación. Validar configuración antes de iniciar. Aceptación: un error de red, fuente o sesión no deja la aplicación indefinidamente en blanco.

#### B08 · P1 · Bloqueo y lista de bloqueados · M/L

Las políticas de `014_privacy_and_blocks.sql` ocultan perfiles bloqueados, mientras `app/blocked-users.tsx` espera poder leer `item.blocked.id` de una relación con usuarios. Esa relación puede resultar nula bajo las propias políticas. Usar el identificador conservado de la relación y una representación mínima autorizada, o un endpoint seguro. Invalidar también contenido afectado del feed y otras vistas al bloquear. Aceptación: bloquear oculta el contenido, no rompe la pantalla de bloqueados y permite desbloquear.

#### B09 · P1 · Comentarios y visibilidad del contenido padre · M/L

**Estado al 20 de octubre: resuelto para reseñas y actividades.** Las políticas comprueban acceso al padre, privacidad, bloqueos y eliminación; la prueba SQL incluye un seguidor pendiente, uno aceptado, contenido retirado y acciones ajenas. Conocer un ID no concede acceso. Ver [evidencia](#reseñas-spoilers-y-comentarios).

La selección de comentarios en `014_privacy_and_blocks.sql` comprueba eliminación y bloqueo del autor, pero no muestra una condición equivalente de acceso al contenido comentado. Auditar lectura e inserción contra reseñas o actividades privadas, eliminadas y bloqueadas. Aceptación: conocer el ID de un contenido no permite acceder a sus comentarios si no se puede acceder al contenido.

#### B10 · P1 · Borradores y mensajes fallidos · M

`ChatThread.tsx` vacía el campo inmediatamente después de iniciar el envío. Una reversión optimista puede hacer desaparecer el intento sin conservar el texto. Añadir estado de envío/fallo, reintento y deduplicación; conservar el borrador. En reseñas, prevenir la pérdida de cambios al salir. La parte de chat se ejecuta antes de activar mensajes, no tiene que retrasar un MVP sin mensajería.

#### B11 · P1 · Notificaciones completas y navegables · M/L

El servidor produce eventos de mensajes y clubes, pero los tipos, etiquetas y destinos del cliente conservan el conjunto anterior. No se encontró la gestión completa de apertura de notificaciones push. La paginación de notificaciones usa solo fecha, lo que puede omitir elementos con la misma marca temporal.

Mantener una tabla compartida de tipos soportados, destino autorizado y texto; usar cursor estable con ID. Probar apertura con app cerrada, abierta y sesión vencida, así como contenido eliminado o privado. Revisar si marcar todo como leído al enfocar la pantalla refleja realmente la intención del usuario.

#### B12 · P1 · Ordenamiento de listas y métricas de comunidad · M/L

El ordenamiento en `src/features/lists/list.queries.ts` lanza actualizaciones independientes sin comprobar todos los errores retornados; puede quedar parcialmente aplicado. Resolver en una operación transaccional y mostrar fallos. Las estadísticas de comunidad en `book.queries.ts` usan muestras limitadas —por ejemplo, hasta 500 puntuaciones—; no deberían presentarse como agregados completos sin indicarlo. Definir si el dato es global o solo de contenido visible y calcularlo en servidor sin filtrar información privada.

### C. Plataforma, operación y mantenimiento

#### C01 · P1 · Exportación completa y retención de datos · L

`supabase/functions/export-user-data/index.ts` convierte errores de algunas consultas en arrays vacíos. Una respuesta exitosa puede resultar incompleta, y falta paginación para volúmenes superiores al límite configurado de la API.

Definir el inventario de datos exportables, incluir versión y fecha del export, paginar y no afirmar éxito completo cuando falle una parte. Revisar qué ocurre con mensajes, miembros, reportes, imágenes y datos compartidos al eliminar una cuenta. Las claves foráneas SQL no eliminan automáticamente archivos de Storage. Probar trabajos programados y reintentos de borrado.

#### C02 · P1 antes de exposición · Limitación de abuso · L

`022_rate_limiting.sql` ya incorpora límites; no es correcto afirmar simplemente que no existen. Pero el RPC recibe clave, máximo y ventana proporcionados por quien llama; hay que revisar su permiso de ejecución, límites de entrada y asociación con la identidad autenticada. El cliente permite continuar en algunos casos de error porque solo rechaza cuando recibe `false`.

Además, límites basados en contar filas pueden sufrir concurrencia, y contar solicitudes por participación puede consumir presupuesto del destinatario por actividad de terceros. Revisar contadores atómicos, expiración/limpieza, límites por emisor y rutas alternativas de escritura. Añadir índices solo tras comprobar el plan: las consultas por emisor/fecha no se benefician necesariamente del índice por conversación/fecha.

Aceptación: no se puede elevar el límite cambiando parámetros, bloquear a otra persona consumiendo su cuota ni saltarse el control con escritura directa.

#### C03 · P1 · Observabilidad real y respetuosa de la privacidad · M/L

Existe una abstracción de crash reporting, pero no se encontró un proveedor conectado mediante `setCrashReporter`. PostHog está instalado, sin una integración operativa identificada. Incorporar errores, trazas de operaciones críticas y métricas de producto mínimas, revisando consentimiento y finalidad. No registrar tokens, correos, mensajes privados ni cuerpos de reseñas. Las preferencias de correo/push no sustituyen automáticamente las decisiones de privacidad de analítica.

#### C04 · P1 · Calidad automatizada y documentación coherente · M/L

No se encontraron reglas activas de ESLint/Prettier ni una pipeline de CI en el repositorio. Definirlas como decisión explícita y respetarlas después, junto con los comentarios básicos en español solicitados para los métodos modificados. Añadir comprobaciones de tipos, pruebas unitarias, integración aislada, migraciones y build de verificación.

Reconciliar documentación que declara completo el MVP o sitúa en el futuro módulos ya implementados. Fijar versiones de Node/pnpm, documentar variables por entorno sin secretos, sincronizar versiones de app y paquete y regenerar tipos de base de datos. Reducir los `any` en contratos sensibles de rutas, perfiles y libros antes que hacer una limpieza masiva sin objetivo.

#### C05 · P1 de lanzamiento · Operación, privacidad y publicación · L/XL

Los archivos de `public/legal/` contienen plantillas y faltan piezas como una política de privacidad final y un inventario de licencias. No se comprobó que las URLs del producto estén publicadas y operativas.

Preparar responsable y contacto de soporte, política real de datos, condiciones, comunidad y procedimiento de moderación. Verificar permisos móviles, avisos de privacidad de tiendas, correo transaccional, redirecciones y recuperación de cuenta. Probar restauración de backups y respuesta a incidentes.

Las reglas de Apple sobre contenido generado por usuarios incluyen filtrado, reporte, bloqueo y respuesta oportuna; «24 horas» puede ser un SLA interno, no debe presentarse como una obligación universal literal. Google Play requiere, en los casos aplicables, un recurso web para solicitar eliminación además del mecanismo dentro de la app. La retención de 30 días elegida por producto requiere revisión según sus obligaciones, no una declaración automática de cumplimiento legal.

## 7. UX/UI: propuesta de mejora por recorrido

### 7.1 Primera sesión

Problema principal: se pide personalización antes de demostrar valor y el último paso no termina el proceso.

Recorrido recomendado:

1. Acceso y explicación breve del beneficio: llevar tus lecturas y descubrir las de otras personas.
2. Nombre de usuario válido; avatar opcional.
3. Buscar y guardar el primer libro.
4. Géneros, meta y contactos como recomendaciones posponibles.
5. Biblioteca o feed con una siguiente acción concreta.

No exigir seguir a cinco personas para poder usar el producto. En una comunidad inicial pequeña, esa condición puede impedir la activación. Si no hay contactos, mostrar una selección real, búsqueda de personas o una invitación; nunca actividad social ficticia.

### 7.2 Biblioteca y ficha

- Usar una única fuente de verdad para estado, puntuación y fechas.
- Mostrar la acción más relevante según el estado: comenzar, actualizar o finalizar, sin esconder las otras posibilidades.
- Separar claramente sinopsis, opinión propia y opiniones de otros.
- Hacer evidente si una cifra representa toda la comunidad, una muestra o las personas seguidas.
- Dejar «quitar de biblioteca» como acción explícita y explicar sus consecuencias.
- Mantener el contexto al cerrar una hoja: posición de scroll, filtro y búsqueda.
- Priorizar una edición simple de fechas sobre estadísticas vistosas que parten de fechas incompletas.

### 7.3 Feed y descubrimiento

- Proteger spoilers en cualquier preview.
- Hacer que el CTA de un feed vacío lleve directamente a descubrir personas o a registrar un libro, según la situación.
- Diferenciar búsqueda de libros, personas y listas mediante etiquetas claras y estados independientes.
- Evitar que una selección basada en listas de ventas en inglés se presente como personalización para un público hispanohablante.
- No añadir algoritmos complejos antes de tener suficientes lecturas, reseñas y contactos reales.

### 7.4 Estados y microtextos

Cada pantalla importante necesita cinco estados diseñados: carga, contenido, vacío, error y permisos insuficientes. Añadir desconexión donde corresponda.

Los mensajes deben decir qué ocurrió y qué puede hacer la persona: «No pudimos guardar tu puntuación. Reintentar» informa mejor que un fallo genérico. Un error de red no equivale a «No hay libros».

Revisar textos mezclados entre traducciones y literales, abreviaturas como «Notifs» y el uso de año fijo. Definir español completo como primera entrega y añadir otros idiomas cuando también estén cubiertos errores, fechas y accesibilidad.

### 7.5 Contraste y tipografía

Relaciones calculadas con los colores declarados, sin considerar transparencias o fondos no inspeccionados en ejecución:

| Combinación                   | Contraste aproximado | Evaluación para texto normal                                |
| ----------------------------- | -------------------- | ----------------------------------------------------------- |
| `#9E9488` sobre `#F5F0EA`     | 2,63:1               | Insuficiente.                                               |
| `#9E9488` sobre `#EBE5DE`     | 2,38:1               | Insuficiente.                                               |
| `#6A635C` sobre `#100D0A`     | 3,28:1               | Insuficiente.                                               |
| `#6A635C` sobre `#1C1815`     | 2,98:1               | Insuficiente.                                               |
| Blanco sobre acento `#C4783A` | 3,45:1               | Insuficiente para texto normal; revisar tamaño/peso reales. |

WCAG establece 4,5:1 para texto normal y 3:1 para texto grande, con condiciones y excepciones específicas. Se usa aquí como referencia de accesibilidad; esta revisión no certifica cumplimiento completo.

Hay dos escalas tipográficas distintas: `tailwind.config.js` define, entre otros, xs/sm/base como 16/18/20, mientras `src/theme/typography.ts` utiliza 11/13/15. También aparecen etiquetas de pestaña de 10 px. Unificar tokens semánticos: cuerpo, ayuda, etiqueta, título y acción. Mantener Playfair para jerarquía editorial y DM Sans para uso funcional si las pruebas de legibilidad lo confirman.

### 7.6 Accesibilidad e interacción móvil

- Revisar tamaños táctiles: el selector de búsqueda tiene 34 de alto y el toggle de consentimiento 44 × 26. El área interactiva puede ampliarse sin aumentar el dibujo.
- Adoptar como criterio de diseño áreas táctiles de aproximadamente 44–48 unidades lógicas y separación suficiente; comprobar el comportamiento por plataforma.
- Añadir etiquetas, rol y estado accesible a búsqueda, limpiar texto, botones, puntuaciones, toggles y selecciones. `PrimaryButton` y `SearchBar` necesitan esta revisión.
- Probar VoiceOver/TalkBack, orden de foco, anuncios de errores y controles solo con iconos.
- Probar texto ampliado hasta 200%, teclado abierto, hojas y formularios pequeños; no depender solo del color para expresar selección o error.
- Respetar preferencias de reducción de movimiento y evitar animaciones que retrasen acciones.
- Revisar teléfono estrecho y tablet: la biblioteca utiliza tres columnas de ancho fijo mientras `supportsTablet` está activado. No asumir adaptabilidad por declarar compatibilidad.

Validación visual pendiente: teléfonos de 320/360/390/430 unidades de ancho, un tablet, ambos temas, textos largos, portadas ausentes y nombres extensos. La estética final debe evaluarse con capturas y uso real, no solo con tokens.

## 8. Rendimiento y tiempos de respuesta

### 8.1 Problemas estructurales observados

| Área                    | Patrón actual                                                                                                                  | Mejora propuesta                                                                          | Prioridad                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Biblioteca              | Resuelto el 20/10: páginas por cursor y totales/etiquetas separados; [evidencia](#biblioteca-personal)                         | Conservar comprobación de rendimiento y gestos en una compilación instalada               | Verificado en SQL y navegador; pendiente nativo |
| Bandeja de mensajes     | Aproximadamente `2 + 2 × N` consultas para N conversaciones: datos base, perfiles, último mensaje y no leídos por conversación | Consulta/RPC agregada autorizada con último mensaje y contador                            | P1 antes de activar chat                        |
| Mensajes en tiempo real | Invalidación amplia al recibir eventos y tras mutaciones                                                                       | Actualizar caché por ID, deduplicar y resincronizar de forma acotada                      | P1/P2 según medición                            |
| Búsqueda sin caché      | Consulta local → Google → inserción → nueva consulta                                                                           | Cancelación, timeout, deduplicación, mejor búsqueda local y revisión de la cascada        | P1                                              |
| Tendencias              | Consulta al proveedor y búsqueda individual de cada ISBN, potencialmente con varias llamadas por libro                         | Resolver libros en lote, caché del servidor, concurrencia limitada y resultados parciales | P1/P2                                           |
| Comunidad de un libro   | Varias consultas y muestras limitadas para agregados                                                                           | RPC de agregados con semántica de privacidad definida                                     | P1                                              |
| Listas del usuario      | Se cargan relaciones de libros y luego se recortan portadas en cliente                                                         | Respuesta limitada a previews y conteos necesarios                                        | P2                                              |
| Notificaciones          | Cursor solo por fecha                                                                                                          | Cursor compuesto estable fecha/ID                                                         | P1 por integridad                               |
| Arranque web            | Artefacto pesado y fuentes exportadas                                                                                          | Medir lo que realmente se descarga; reducir familias/pesos e imports de iconos si aporta  | P2; P1 si afecta el canal elegido               |
| Modo sin conexión       | No se identificó integración de NetInfo con el gestor de conexión ni persistencia de consultas                                 | Aviso claro, lecturas cacheadas cuando existan y reintento seguro                         | P1 básico; sincronización completa futura       |

Ejemplo del coste de la bandeja: 100 conversaciones pueden generar aproximadamente 202 consultas con el patrón actual. Esto no permite deducir su latencia exacta, pero sí identifica una multiplicación evitable del trabajo.

En búsqueda sin resultado local, el recorrido observado añade 400 ms de debounce y aproximadamente tres operaciones de base de datos más una del proveedor. Una aproximación conceptual es `400 ms + 3 × T_base + T_proveedor + renderizado`; no es una medición y las duraciones de cada operación pueden diferir.

La búsqueda local tiene además cuestiones de calidad: se centra en título, un único resultado puede evitar ampliar con el proveedor, y la normalización necesita respetar acentos. La validación actual de ISBN merece incluir ISBN-10 terminados en X y comprobar formato/checksum cuando corresponda.

No cambiaría automáticamente el chat de FlatList a FlashList: la lista invertida tiene restricciones concretas. Primero medir y verificar compatibilidad; virtualizar no corrige por sí solo consultas excesivas.

### 8.2 Objetivos iniciales de rendimiento, no resultados actuales

Se proponen como presupuestos para una primera campaña en dispositivo Android de gama media y un iPhone representativo, build de producción, región documentada y red móvil controlada. Deben ajustarse después de la línea base.

| Operación                                | Meta inicial propuesta                                     | Qué medir                                                                 |
| ---------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Arranque en frío                         | p95 ≤ 3 s                                                  | Desde abrir hasta poder interactuar con la pantalla útil.                 |
| Reanudación en caliente                  | p95 ≤ 1 s                                                  | Volver a interactuar; separar recuperación de red.                        |
| Feed/biblioteca con caché en memoria     | p95 ≤ 200 ms                                               | Mostrar contenido previo al navegar.                                      |
| Primera página de feed/biblioteca en red | p95 ≤ 1,5 s                                                | Contenido útil, no solo skeleton.                                         |
| Búsqueda resuelta localmente             | p95 ≤ 1 s                                                  | Desde terminar de escribir; incluye debounce.                             |
| Búsqueda que requiere proveedor          | p95 ≤ 3 s                                                  | Resultados útiles o fallo recuperable; mantener feedback mientras espera. |
| Guardado de estado/puntuación            | Respuesta visual ≤ 100 ms; confirmación p95 ≤ 1,5 s        | Distinguir actualización optimista de persistencia confirmada.            |
| Carga incremental                        | Sin bloqueos perceptibles del scroll                       | Frames lentos, tiempo por página y memoria acumulada.                     |
| Errores y estabilidad                    | Objetivo inicial ≥ 99,5% de sesiones sin cierre inesperado | Muestra y periodo explícitos; no inferirlo de tres tests.                 |

No se dispone aún de valores p50/p95 reales. No se deben publicar estas metas como prestaciones de la app.

### 8.3 Campaña de medición

1. Instrumentar inicio/fin/error de las operaciones centrales sin contenido personal.
2. Registrar versión, dispositivo, red, región, tamaño de datos y caché fría/caliente.
3. Medir al menos 100 operaciones comparables para un p95 orientativo; ampliar la muestra para decisiones de capacidad.
4. Separar tiempo de interfaz, API, base de datos y proveedor externo.
5. Probar bibliotecas de 100, 1.000 y 10.000 entradas sintéticas en staging; revisar el límite de filas de la API del proyecto.
6. Medir scroll, memoria y remontajes con imágenes y textos realistas, no solo datos mínimos.
7. Revisar consultas con planes de ejecución e índices sobre staging, sin crear índices especulativos en producción.
8. Comparar antes/después con las mismas condiciones y dejar registro de regresiones.

Añadir timeouts y cancelación donde corresponda, limitar concurrencia y no reintentar automáticamente escrituras no idempotentes sin protección. `QueryBoundary` debería conservar datos útiles durante un fallo de refresco cuando la privacidad lo permita.

## 9. Plan por fases

### Fase 0 · Base estable y seguridad

**Objetivo:** poder reproducir el entorno y confiar en sus límites de acceso.

**Estimación orientativa:** 5–10 días de desarrollo con conocimiento de Expo/Supabase, acceso a configuración y un entorno de pruebas disponible. Confianza media-baja hasta comprobar el estado remoto.

Entregables:

- Alinear dependencias Expo y versiones de ejecución: A03.
- Reconciliar migraciones y crear staging reproducible: A04.
- Corregir o descartar mediante pruebas A05, A06 y A07; revisar B09.
- Separar y habilitar pruebas unitarias/integración: A09.
- Configurar validación de variables y errores de arranque: B07.
- Añadir controles mínimos de calidad y un documento único de configuración: C04.

**Criterio de salida:** build nativo instalable; migraciones reproducibles; pruebas de permisos del alcance activado en verde; ningún riesgo P0 abierto en las tablas expuestas.

### Fase 1 · MVP funcional completo

**Objetivo:** que una persona pueda completar su ciclo de lectura sin pérdidas, simulaciones ni callejones sin salida.

**Estimación orientativa:** 10–20 días de desarrollo. Depende de Fase 0 y de decidir el alcance de acceso social, etiquetas y listas.

Entregables:

- Onboarding persistente y acceso/confirmación verificados: A01.
- Guardado unificado y manejo visible de errores: A02, B01, B03.
- Fechas, meta y refresco consistente: B04.
- Búsqueda con errores reales y biblioteca paginada: B06 y rendimiento.
- Feed inicial útil y spoilers protegidos: B02.
- Retirar datos de demostración y controles sin efecto: B05.
- Bloqueo, comentarios y listas confiables: B08, B09, B12.
- Notificaciones de los eventos incluidos: B11.
- Contraste, escalas tipográficas y accesibilidad de componentes centrales.

**Criterio de salida:** el recorrido completo se ejecuta en Android/iOS, sobrevive a cerrar la app y funciona con red lenta, errores y datos vacíos. Ninguna acción visible promete un guardado que no exista.

### Fase 2 · Beta y preparación de lanzamiento del MVP

**Objetivo:** poder observar, operar y corregir el producto con usuarios reales.

**Estimación orientativa:** 5–10 días de desarrollo, más tiempo de observación de la beta y revisiones externas.

Entregables:

- Eliminación y exportación probadas: A08, C01.
- Límites de abuso efectivos: C02.
- Monitorización de errores y operaciones, métricas mínimas: C03.
- Medición y corrección de cuellos de botella prioritarios.
- Pruebas de dispositivos, accesibilidad, enlaces y push.
- Documentación pública final, soporte y moderación: C05.
- Procedimiento de despliegue, rollback, backup y restauración verificado.
- Beta inicial de 20–50 personas; ampliar hacia la cohorte de 200–500 mencionada en la documentación cuando el soporte y las métricas lo permitan.

**Criterio de salida:** sin P0; recorridos críticos y privacidad probados; errores observables; responsable de soporte; requisitos de publicación revisados. Los P1 pendientes tienen una decisión explícita: corregir, retirar la funcionalidad o aceptar un riesgo acotado documentado.

Las fases 0–2 representan aproximadamente **20–40 días de desarrollo**, equivalentes a 4–8 semanas de trabajo efectivo de una persona con el contexto necesario. No incluyen esperas de tiendas, asesoría legal, configuración de terceros, aprendizaje ni ampliaciones de alcance. Un problema importante en el esquema remoto puede aumentar el rango.

### Fase 3 · Retención y utilidad personal

**Objetivo:** que regresar sea útil aunque la red social todavía sea pequeña.

Elegir pocas iniciativas según datos y entrevistas:

1. Importación de Goodreads: preview, mapeo de ediciones, duplicados, fechas, errores por fila y posibilidad de corregir el resultado.
2. Estadísticas simples y confiables: libros terminados, evolución mensual, géneros y autores; explicar la calidad de los datos.
3. Progreso de lectura, notas privadas y relecturas, con modelo de datos que distinga libro de sesión de lectura.
4. Recordatorios voluntarios y preferencias detalladas; evitar presión por rachas como mecanismo principal.
5. Recomendaciones sencillas basadas en géneros, lecturas y personas seguidas, explicando el motivo.
6. Mejora de metadatos, ediciones/idiomas y libros ausentes con controles de calidad.

**Orden de magnitud:** un ciclo de 2–4 semanas para un subconjunto, no para completar toda la lista. Revisar retención y entrevistas antes del siguiente ciclo.

**Criterio de éxito:** utilidad y recurrencia observables, no solo más pantallas. No iniciar IA para compensar datos incompletos o una búsqueda defectuosa.

### Fase 4 · Comunidad avanzada: clubes y mensajes

**Objetivo:** activar el código existente con permisos, moderación y costes controlados.

Dependencias: A07, B10, B11, C02 y rendimiento de la bandeja resueltos.

Entregables por incrementos:

- Clubes privados/públicos, solicitudes, roles y transferencia/salida del propietario claramente definidas.
- Mensajes con invitación/aceptación, bloqueo, reporte, borradores, fallos recuperables y contadores coherentes.
- Bandeja agregada, suscripciones acotadas y paginación probada.
- Reglas de moderación y responsables; retención/eliminación de conversaciones documentadas.
- Lecturas conjuntas y eventos solo después de comprobar el uso de clubes básicos.
- Activación por cohortes y controles del servidor; no depender exclusivamente de flags visuales.

**Orden de magnitud:** 3–6 semanas para un alcance reducido, sujeto al estado real del backend. Lo ya construido reduce trabajo de pantallas, pero no elimina el de seguridad y operación.

### Fase 5 · Expansión y sostenibilidad

Condicionada a retención, demanda y capacidad de soporte:

- Experiencia web pública, enlaces compartibles y posicionamiento de contenido que sea realmente público.
- Sincronización offline con cola de operaciones, resolución de conflictos y política de privacidad local.
- Idiomas adicionales y mejor cobertura regional de catálogos.
- Retos, resúmenes anuales y colaboraciones con comunidades.
- Funciones premium únicamente después de definir valor, restauración de compras y obligaciones de las tiendas.
- IA con evaluación de utilidad, límites de coste, trazabilidad de recomendaciones y protección de datos.

No se estima esta fase como un bloque único: debe dividirse en experimentos con hipótesis, coste máximo y criterio de abandono.

## 10. Pruebas de aceptación y seguridad

### Matriz mínima de acceso

Probar con cuentas y sesiones separadas: anónimo, propietario del dato, extraño autenticado, seguidor pendiente, seguidor aceptado, bloqueado, moderador y administrador. Para clubes: extraño, solicitante, miembro, moderador y propietario.

| Recurso/acción                   | Casos indispensables                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Perfil y biblioteca privados     | Acceso directo por ID; seguimiento pendiente/aceptado; cambio de privacidad; bloqueo en ambas direcciones. |
| Reseñas, actividad y comentarios | El permiso del contenido padre se mantiene; datos eliminados no reaparecen por otra ruta.                  |
| Seguimientos                     | No autoconceder aceptación; no cambiar participantes; rechazo y revocación autorizados.                    |
| Perfil editable                  | No modificar rol, contadores o campos internos usando una petición manual.                                 |
| Clubes y miembros                | No autoconceder propietario/moderador; invitaciones y expulsiones autorizadas.                             |
| Mensajes                         | Solo participantes autorizados; solicitud pendiente; bloqueo; paginación y tiempo real sin fugas.          |
| Listas                           | Lectura/escritura privadas y públicas; ordenamiento atómico; no añadir a listas ajenas.                    |
| Cuenta y exportación             | Solo datos propios; sesión vencida; exportación extensa; fallos parciales; archivos asociados.             |
| Funciones de servidor            | Permisos EXECUTE, validación de identidad, parámetros acotados y ausencia de secretos en respuestas/logs.  |

Estas pruebas deben llamar directamente a la API: ocultar botones no comprueba seguridad.

### Recorridos funcionales

- Registro nuevo, confirmación tardía, enlace expirado, recuperación, cierre y reinicio.
- Onboarding interrumpido y nombre ocupado por otra cuenta durante el guardado.
- Libro encontrado localmente, encontrado en proveedor, no encontrado y proveedor caído.
- Guardar/cambiar/quitar estado y puntuación desde ficha, feed y biblioteca.
- Terminar una lectura pasada y comprobar meta anual, perfil y biblioteca.
- Crear/editar reseña con spoiler y verificar todas sus representaciones.
- Reportar, bloquear, refrescar y desbloquear sin perder acceso a los controles.
- Crear lista, reordenar con fallo intermedio y verificar el orden final.
- Abrir notificación en frío/caliente, sin sesión y con contenido ya inaccesible.
- Solicitar exportación/eliminación con datos voluminosos y fallos simulados.

### Calidad visual y de dispositivo

- Temas claro/oscuro; texto ampliado; lector de pantalla; teclado; áreas seguras.
- Pantallas pequeñas y tablet; nombres largos; sin avatar/portada; traducciones largas.
- Red lenta, desconexión, retorno desde segundo plano y memoria limitada.
- Compilaciones de producción: no evaluar velocidad final solo en modo desarrollo.

## 11. Métricas y operación

### Métricas de producto iniciales

- Activación: porcentaje de cuentas nuevas que guardan su primer libro; medir el tiempo hasta ese evento.
- Activación social: porcentaje que sigue a alguien y recibe actividad relevante; separar esta métrica de la personal.
- Retención D1/D7/D30 por cohorte, aclarando qué evento cuenta como regreso útil.
- Lectores activos semanales que actualizan una lectura, guardan un libro o publican una reseña.
- Éxito de búsqueda: búsquedas que terminan en ficha/guardado; consultas sin resultados y errores del proveedor por separado.
- Finalización de reseñas frente a abandono del editor.
- Reportes, bloqueos, tiempo de atención y reincidencia, sin exponer contenido privado en analítica.

No hay línea base actual ni una tasa de retención universal que garantice éxito. Primero observar cohortes pequeñas y entrevistar a quienes abandonan.

### Métricas técnicas y económicas

- p50/p95 de búsquedas, páginas, guardados y arranque, separados por red/dispositivo.
- Errores de cliente y funciones, sesiones sin cierre inesperado y operaciones que requieren reintento.
- Consultas por interacción, filas leídas/devueltas y eventos de tiempo real.
- Cuotas y fallos de Google Books/NYT, correo y push.
- Tamaño de base de datos, Storage, transferencia y coste por usuario activo.
- Resultado de trabajos de eliminación, limpieza y backups; alertas cuando dejan de ejecutarse.

Responsabilidades mínimas, aunque las asuma una sola persona: desarrollo/release, revisión de seguridad, soporte/moderación y decisión de producto. Cada incidente debe tener a quién avisar y una forma de limitar el impacto.

## 12. Primer backlog ejecutable

| Orden | Trabajo                                                  | Dependencia                  | Resultado verificable                                    |
| ----- | -------------------------------------------------------- | ---------------------------- | -------------------------------------------------------- |
| 1     | Fijar entorno y alinear Expo                             | Ninguna                      | Instalación y build nativo reproducibles.                |
| 2     | Crear staging y reconciliar migraciones                  | Acceso autorizado al esquema | Base reconstruible sin tocar producción.                 |
| 3     | Probar/corregir seguidores, columnas y roles             | 2                            | Matriz de permisos en verde.                             |
| 4     | Habilitar pruebas unitarias/integración y CI mínimo      | 1–2                          | Resultados confiables, sin falsos éxitos.                |
| 5     | Terminar onboarding y confirmación                       | 1–3                          | Cuenta nueva llega a su primera lectura y puede retomar. |
| 6     | Unificar guardar libro, puntuación y fechas              | 3–5                          | Persistencia consistente desde todas las entradas.       |
| 7     | Añadir feedback, spoilers y acciones seguras             | 6                            | Errores visibles y contenido protegido.                  |
| 8     | Paginar biblioteca y mejorar búsqueda/estados vacíos     | 6–7                          | Datos completos, carga acotada y fallos distinguibles.   |
| 9     | Cerrar eliminación/exportación, moderación y publicación | 2–4                          | Operación sensible probada y documentación real.         |
| 10    | Medir, corregir accesibilidad y lanzar beta acotada      | 5–9                          | Evidencia de uso, estabilidad y rendimiento.             |

Las tareas de documentación, diseño de estados y preparación de soporte pueden avanzar junto al desarrollo. Las dependencias de permisos y datos no deberían omitirse para adelantar una pantalla.

## 13. Decisiones de producto que conviene cerrar

No impiden empezar la Fase 0, pero afectan el alcance posterior:

1. ¿Primera entrega en Android, iOS o ambas? La propuesta asume ambas; priorizar una reduce el trabajo inicial de validación.
2. ¿La primera promesa es biblioteca personal con comunidad, o red social de lectura? Recomiendo la primera para reducir la dependencia de tener contactos activos.
3. ¿Acceso por correo basta para beta o Google es obligatorio desde el inicio?
4. ¿Fechas y etiquetas son obligatorias en el MVP? Si se mantienen, deben poder editarse; la meta no puede depender de fechas invisibles.
5. ¿Se permite leer contenido público sin cuenta? Define onboarding, enlaces compartidos y futuras páginas web.
6. ¿Quién atiende reportes y solicitudes de datos, en qué horario y con qué plazo interno?
7. ¿Qué países/edades se atenderán inicialmente y qué requisitos de privacidad corresponden? Requiere revisión específica, no una plantilla genérica.
8. ¿Qué límite mensual de infraestructura/proveedores es aceptable? Configurar alertas antes de ampliar usuarios.

## 14. Definición de terminado

Una funcionalidad se considera terminada cuando:

- Tiene un recorrido completo y comprensible, no solo una pantalla.
- Persiste correctamente y se refleja en las demás vistas afectadas.
- Expone carga, vacío, éxito, error y permisos de forma apropiada.
- Está protegida en el servidor y tiene pruebas negativas de acceso cuando aplica.
- No pierde silenciosamente texto o datos ante un fallo.
- Es accesible en los dispositivos y tamaños elegidos.
- Cuenta con pruebas proporcionales al riesgo y métricas si afecta el recorrido crítico.
- Cumple las reglas de formato/lint que se configuren en el repositorio; los métodos creados o modificados llevan comentarios básicos en español.
- Tiene documentación actualizada, responsable y forma de recuperación o desactivación segura.

## 15. Fuentes y trazabilidad

### Evidencia local principal

- Producto y alcance: `CLAUDE.md`, `docs/STACK.md`, `docs/pendientes.md`, `docs/moderacion.md`, `public/legal/README.md`.
- Entorno: `package.json`, `pnpm-lock.yaml`, `.npmrc`, `eas.json`, `app.json`, `tsconfig.json`.
- Entrada: `app/_layout.tsx`, `app/(auth)/onboarding/`, `src/features/auth/hooks/useRegister.ts`.
- Lectura: `src/features/book/components/BookDetailSheet.tsx`, `QuickPeekSheet.tsx`, `BookSimilarTab.tsx`, `app/book/[id].tsx`, `src/features/book/book.queries.ts`.
- Datos y feedback: `src/features/user/user.queries.ts`, `src/features/lists/list.queries.ts`, `src/lib/query-client.ts`, `src/stores/ui.store.ts`.
- Rendimiento: `src/features/chat/chat.queries.ts`, `src/features/chat/hooks/useRealtimeMessages.ts`, `src/lib/google-books.ts`, `src/features/book/hooks/useTrendingBooks.ts`.
- Seguridad: `supabase/migrations/001_initial_schema.sql`, `014_privacy_and_blocks.sql`, `017_privilege_and_search_path_hardening.sql`, `020_messaging.sql`, `022_rate_limiting.sql`.
- Cuenta: `supabase/functions/delete-account/index.ts`, `supabase/functions/export-user-data/index.ts`, `src/features/user/hooks/useAccountDeletion.ts`.
- Calidad: `src/test-utils/supabase.ts`, `src/__tests__/`, `src/lib/crash-reporting.ts`, `src/theme/`, `tailwind.config.js`.

Las referencias describen el código revisado en esta fecha. Deben revalidarse al cambiar implementación o esquema desplegado.

### Referencias oficiales consultadas

- Expo: [actualización y alineación de dependencias del SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), para A03. Los rangos de la tabla proceden del chequeo local, no de una recomendación genérica de instalar la última versión.
- PostgreSQL: [permisos de tabla y de columna](https://www.postgresql.org/docs/current/sql-grant.html), para A06; una revocación por columna no anula una concesión de tabla existente.
- Supabase: [seguridad por filas](https://supabase.com/docs/guides/database/postgres/row-level-security) y [permisos de ejecución de funciones](https://supabase.com/docs/guides/database/functions), para la matriz de acceso y revisión de RPC.
- Supabase: [firma de `auth.admin.signOut`](https://supabase.com/docs/reference/javascript/auth-admin-signout), para A08; el argumento de autenticación es un JWT de sesión.
- W3C: [criterio de contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), para las referencias de 4,5:1 y 3:1. No sustituye una auditoría completa de accesibilidad.
- Vercel: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), como apoyo para revisar feedback, controles y accesibilidad, adaptados a React Native.
- Apple: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), especialmente 1.2 y 4.8, para revisar contenido de usuarios y métodos de acceso antes de publicar.
- Google Play: [requisitos de eliminación de cuentas](https://support.google.com/googleplay/android-developer/answer/13327111), para preparar el mecanismo interno y el recurso web aplicable.

Las referencias de tiendas y privacidad son una lista de comprobación técnica y de producto, no asesoría legal ni una certificación de aprobación.

---

**Recomendación final:** terminar y validar el núcleo existente antes de ampliar funcionalidades. La primera señal de un buen MVP será que una persona pueda guardar, recordar y compartir sus lecturas con confianza, no la cantidad de módulos visibles.

## Anexo: contratos y comprobaciones de funcionalidades

### Acceso por correo y onboarding

Actualizado: 20 de octubre de 2026.

#### Recorrido de acceso

- El registro envía nombre, correo normalizado y contraseña a Supabase.
- Si Supabase devuelve una sesión, el guard consulta el perfil y abre el onboarding pendiente.
- Si la confirmación está activada, se muestra el correo y se permite reenviar con una espera de 60 segundos. No se presupone que la cuenta existe ni se fuerza un ajuste del servidor.
- El retorno de confirmación crea la sesión y continúa con el perfil. Un error del enlace ofrece volver al acceso o solicitar recuperación.
- El cierre normal usa `scope: local`: cierra este dispositivo. La recuperación finaliza con cierre global para revocar las sesiones anteriores.

La configuración pública del proyecto consultada durante este cambio tiene el proveedor de correo activado, registro permitido y confirmación requerida. El código cubre también el caso que devuelve una sesión inmediata.

#### Enlaces y configuración de Supabase

El único destino nuevo es `auth-callback`, construido con `Linking.createURL`. Su consulta indica `flow=signup`, `flow=recovery` o `flow=oauth`. Se admite el retorno anterior `auth/callback` para proveedores externos.

Configurar en **Authentication → URL Configuration → Redirect URLs**:

- Compilaciones nativas: `lexa://auth-callback**`.
- Desarrollo con Expo Go: la URL de desarrollo generada por Expo, incluida la ruta `/--/auth-callback`.
- Vista previa web: el origen usado por el servidor local más `/auth-callback**`; el script de comprobación usa `http://localhost:8082`.

La plantilla estándar puede conservar `{{ .ConfirmationURL }}`. Para plantillas que usen `token_hash`, conservar también el tipo de verificación: `signup`/`email` para confirmación y `recovery` para recuperación. Los retornos PKCE se intercambian cuando Supabase entrega un `code` y existe su verificador en el mismo dispositivo.

`detectSessionInUrl` está desactivado para que el SDK y el callback no consuman el mismo enlace. El callback valida el propósito, exige credenciales completas y verifica la sesión con Supabase. En web retira códigos y tokens del historial después de consumir el enlace, también si falla. Ningún mensaje de interfaz incluye los tokens ni el error remoto sin filtrar.

Los ajustes de SMTP, entrega real y allowlist deben comprobarse en el entorno que se publique. No se enviaron correos reales durante las pruebas.

#### Reanudación y datos privados

`use-auth-session.ts` es la única suscripción global al SDK:

1. Recupera la sesión guardada y comprueba la identidad con `getUser`.
2. Una sesión rechazada se cierra localmente. Un fallo temporal muestra reintento y conserva las credenciales.
3. Un evento de acceso más reciente tiene prioridad sobre una lectura inicial que termine tarde.
4. Al cerrar sesión o cambiar de cuenta se vacía TanStack Query para retirar los datos privados de la cuenta anterior.
5. En nativo, la renovación automática se activa en primer plano y se detiene en segundo plano. La web conserva la gestión de visibilidad del SDK.

Los tokens nativos permanecen en SecureStore y no migran a otro dispositivo. El adaptador divide por bytes UTF-8, publica el manifiesto solo después de escribir todos los fragmentos y conserva la versión anterior si falla una escritura. Puede leer los fragmentos del formato anterior. El bloqueo de procesos del SDK serializa operaciones de sesión nativas.

La web sigue siendo un destino de desarrollo/vista previa. Si se publica como producto web, deberá revisarse la estrategia de sesión y protección frente a XSS; este cambio conserva el almacenamiento web existente.

#### Recuperación interrumpida

El contexto de recuperación guarda únicamente la cuenta y si la contraseña ya se actualizó. Usa el mismo almacén seguro. Al reiniciar, la misma cuenta vuelve al formulario de recuperación, incluso si su onboarding ya terminó. Las rutas privadas permanecen cubiertas y redirigen a recuperación.

El cambio de contraseña y el cierre global son dos operaciones distintas. Si falla el cierre después de actualizar, la interfaz ofrece **Finalizar recuperación**. El reintento, también después de reiniciar, no vuelve a cambiar una contraseña que el servidor ya aceptó. Al terminar se retiran sesión, contexto y caché.

La pantalla exige sesión y modo de recuperación antes de mostrar campos. Abrir `new-password` directamente sin ellos ofrece solicitar un enlace válido. Estos controles organizan la interfaz: la autorización real corresponde a Supabase Auth y las políticas RLS.

#### Onboarding corto

Se pueden elegir géneros y meta, saltar cada paso o pulsar **Dejar gustos y meta para después** para ir directamente al usuario. Las preferencias se guardan antes de avanzar; los pasos 1, 2 y 3 permiten reanudar el recorrido. Al posponer la meta se conserva el punto de partida existente, actualmente 12 libros, que puede cambiarse después en Ajustes.

El nombre se normaliza a minúsculas, permite de 3 a 30 letras ASCII, números y guion bajo, y se consulta tras una pausa de 350 ms. Si la consulta falla, **Volver a comprobar** reintenta sin borrar el campo. Un resultado de disponibilidad no reserva el nombre: la restricción única y `complete_onboarding` resuelven las carreras al guardar. Un conflicto invalida la disponibilidad anterior y permite elegir otro.

La migración `20261020135220_auth_username_availability.sql` mantiene la función pública como `SECURITY INVOKER`. La comprobación global de nombres se ejecuta en un ayudante de privilegios elevados dentro de `lexa_auth`, un esquema que debe permanecer fuera de los esquemas expuestos por PostgREST. Solo `authenticated` puede ejecutarlo y siempre exige `auth.uid()`. Solo devuelve un booleano; los bloqueos no liberan nombres ya reservados. La migración ya fue aplicada al proyecto Lexa y su versión coincide con la del archivo.

#### Comprobaciones

- `pnpm typecheck`.
- `pnpm lint:auth`, ESLint sobre los archivos compartidos modificados y Prettier según la configuración del repositorio.
- Pruebas unitarias de enlaces, rutas de acceso, estado de recuperación, normalización y almacenamiento interrumpido.
- `supabase/tests/onboarding-flow.sql`: prueba real de disponibilidad, nombres duplicados/nulos, bloqueo entre cuentas, permisos anónimos y finalización sin géneros. La transacción termina con rollback.
- `scripts/check-auth-preview.cjs`: navegador aislado con respuestas HTTP simuladas, sin correos ni cambios en cuentas reales. Incluye registro con y sin confirmación, recuperación, reanudación, fallo de cierre, reintento de sesión y rutas inválidas; guarda capturas en `.expo/auth-preview`.

Para la prueba de navegador, iniciar Expo en el puerto 8082 e indicar un Playwright ya disponible:

```powershell
pnpm exec expo start --web --port 8082
$env:LEXA_BROWSER_MODULES = 'ruta/absoluta/a/node_modules'
node scripts/check-auth-preview.cjs
```

Se puede cambiar el origen con `LEXA_AUTH_PREVIEW_URL` y el canal del navegador con `LEXA_BROWSER_CHANNEL`.

La prueba en navegador no sustituye la validación de SecureStore, enlaces desde correo, bloqueo/desbloqueo del dispositivo y segundo plano en Android/iOS. La prueba unitaria del adaptador usa un almacén en memoria para reproducir interrupciones. Queda comprobar entrega SMTP y el recorrido nativo en una compilación instalada.

---

### Biblioteca personal

La biblioteca consulta el estado seleccionado y combina búsqueda por título o autor, puntuación (todos, con o sin puntuación) y etiquetas existentes. La búsqueda espera 350 ms y trata el texto como literal: `%` no se convierte en un comodín. Las etiquetas se obtienen de toda la estantería, incluyendo libros aún no descargados.

#### Datos y paginación

- `search_library` aplica los filtros en PostgreSQL y devuelve hasta 25 registros. El cliente muestra 24 y usa el adicional para detectar si hay otra página.
- El orden visible es «Añadidos más recientes primero». El cursor `(created_at, id)` resuelve empates y permanece estable al editar puntuación o estado. Las fechas nulas anteriores al cambio se ordenan como época Unix.
- `library_summary` agrupa totales y etiquetas en el servidor. Los totales no dependen del límite de filas de REST ni de la cantidad de páginas cargadas.
- Ambas funciones son `SECURITY INVOKER`, fijan `search_path` vacío, aplican `auth.uid()` y conservan RLS. Solo `authenticated` puede ejecutarlas; no aceptan un identificador de cuenta del cliente.
- Las páginas tienen claves distintas de las consultas simples del perfil. Todas conservan el prefijo de biblioteca para que guardar, editar o quitar una lectura invalide también páginas, totales y etiquetas.

La pantalla vive en `src/features/library/screens/` porque `CLAUDE.md` exige que `app/` contenga solamente rutas. No se añaden intermediarios de componentes: las portadas abren directamente `BookReadingSheet`.

#### Experiencia y estados

La cuadrícula adapta las columnas al ancho disponible. Las pestañas y filtros se desplazan horizontalmente para conservar las etiquetas y los objetivos táctiles. Tipografía, colores, superficies, radios, portadas y puntuación usan el design system existente, con temas claro y oscuro.

Cada estado sin libros explica cómo alimentarlo. Una combinación sin coincidencias permite limpiar los filtros sin cambiar de estantería. Los errores iniciales ofrecen reintento; un fallo de página adicional conserva los libros cargados y muestra un reintento explícito. Hay carga incremental al acercarse al final, una acción manual para cargar más y actualización por arrastre.

Las etiquetas permiten filtrar datos existentes; su creación y edición no forman parte de este punto del MVP.

#### Verificación

- `supabase/tests/library-pagination.sql`: ejecutado contra Supabase con cuentas sintéticas y `ROLLBACK`. Comprueba 55 libros con la misma fecha distribuidos en tres páginas sin duplicados ni omisiones, búsqueda por autor, texto literal, puntuación, etiquetas fuera de la primera página, estados, vacíos, totales y permisos entre cuentas y anónimos.
- `scripts/check-library-preview.cjs`: cliente real en navegador con HTTP simulado. Comprueba filtros combinados, búsqueda fuera de la primera página, paginación, error y reintento sin perder los libros cargados, errores iniciales, vacíos y anchos de 320, 390 y 1280 px en claro/oscuro.
- `scripts/check-reading-preview.cjs`: conserva la comprobación de edición desde biblioteca y las demás entradas.
- TypeScript, ESLint, Prettier y tokens de tema correctos; 48 pruebas unitarias y de componentes aprobadas. Cuatro suites de integración preexistentes no arrancan sin las credenciales de `.env.test` (auth/RLS, clubs, chat y Google Books). La seguridad específica de este cambio sí se comprueba con el SQL real anterior.

Pendiente de lanzamiento: recorrido en Android/iOS instalado, teclado, escalado de fuente y arrastre nativo. Las pruebas de navegador no sustituyen esa verificación.

---

### Registro de lectura

#### Entradas y componentes

Búsqueda, biblioteca, listas y feed usan directamente `BookReadingSheet`; búsqueda indica `showSynopsis={false}` para conservar su presentación breve. Las ayudas de búsqueda usan directamente `BottomSheet`. La ficha completa usa el mismo `ReadingRecordControls` en Resumen y abre la hoja desde sus acciones superiores. Los enlaces a libros del perfil, reseñas y similares desembocan en esa ficha. Los componentes comparten tipografía, colores semánticos, geometría, foco y áreas táctiles del design system, con textos en español e inglés.

`app/book/[id].tsx` solo exporta la pantalla de `src/features/book/screens`. La lógica de consultas y escrituras vive en `src/features/library`, separada de los componentes visuales.

El hook generado `useColors` consulta el tema activo de `useThemeStore`, igual que la raíz de la aplicación. Esto mantiene los iconos y los colores inline sincronizados con las clases del design system al cambiar de tema.

#### Estados y puntuación

- **Pendiente:** no tiene fechas de inicio ni finalización.
- **Leyendo:** propone el día local de inicio. Si se vuelve desde Leído, empieza con la fecha de hoy y retira la finalización anterior.
- **Leído:** propone el día local de finalización al entrar al estado. Se puede corregir a una fecha anterior.
- **Abandonado:** conserva el inicio conocido y no cuenta como finalizado.

Tocar el estado activo no cambia ni elimina nada. Cambiar el estado conserva la puntuación y las etiquetas. Una puntuación va de 0,5 a 5 en pasos de 0,5: tocar una estrella selecciona la nota completa y repetir la pulsación selecciona media estrella. **Quitar puntuación** envía `null`; nunca elimina el libro ni sus fechas. Puntuar un libro todavía no guardado lo crea como Pendiente, sin dar por terminada una lectura.

#### Fechas y meta anual

La fecha de inicio es opcional; al finalizar se registra una fecha de fin. **Fechas de lectura** permite corregirlas juntas, usar Hoy o retirar el inicio. Se rechazan días inexistentes, fechas futuras e intervalos invertidos. El cliente utiliza fechas `AAAA-MM-DD` del dispositivo, sin convertirlas a UTC. El servidor acepta como día local únicamente hoy o un día adyacente al calendario UTC para cubrir husos horarios.

La meta cuenta filas con estado `read` y `finished_at` dentro del año consultado. Editar una puntuación no mueve el libro a otro año. La clave de caché incluye el año y, al cambiar de calendario, el objetivo de un año anterior no se presenta como objetivo ya configurado para el nuevo: se usa el valor inicial de 12 hasta editarlo.

Las lecturas antiguas sin finalización mantienen la fecha desconocida. No se hace un backfill con la fecha de edición: la interfaz solicita añadir una fecha antes de incluirlas en una meta. El MVP conserva un registro por usuario y libro; no añade un historial de relecturas.

#### Escritura y seguridad

`save_reading_record(book_id, changes, today)` es una RPC `SECURITY INVOKER`, con `search_path` vacío y ejecución solo para `authenticated`. Obtiene el propietario desde `auth.uid()` y conserva las políticas RLS existentes. No acepta un propietario ni columnas arbitrarias en el JSON.

El bloqueo transaccional por usuario y libro cubre también la primera inserción. Cada propiedad omitida conserva su valor; `null` elimina explícitamente el dato. La RPC vuelve a validar las fechas y las restricciones SQL protegen el orden, la correspondencia entre estado y fechas y la escala de puntuación. Los contadores siguen dependiendo de los triggers existentes, sin incrementos manuales desde el cliente.

La migración `20261020154206_reading_tracking_mvp.sql` está aplicada al proyecto Lexa. `src/types/database.ts` se regeneró desde ese proyecto.

#### Caché y errores

La escritura optimista distingue entre ausencia y `null`. Se cancelan consultas previas, se conserva una instantánea y se restaura si falla la escritura. Al responder, la fila del servidor sustituye la proyección. Los controles del mismo libro comparten una identidad de mutación y las escrituras se serializan.

Después se invalidan biblioteca, contadores, meta anual, perfil, lecturas recientes, comunidad del libro, feed y puntuaciones asociadas a reseñas. Si no se pudo cargar la lectura, se ofrece Reintentar antes de permitir cambios. Los errores de guardado mantienen los datos anteriores y se comunican junto al formulario.

#### Verificación

- `pnpm typecheck`, ESLint sobre los archivos modificados, Prettier y `pnpm check:theme`.
- `src/__tests__/features/library/reading-record.test.ts`: transiciones, fechas reales, años, retirada explícita y lecturas antiguas.
- `supabase/tests/reading-record.sql`: pruebas reales de RPC, RLS entre cuentas, restricciones, contadores y cambios de año. Se ejecuta en una transacción con rollback y cuentas sintéticas.
- `scripts/check-reading-preview.cjs`: navegador aislado con el cliente real y respuestas HTTP simuladas. Recorre ficha, búsqueda, biblioteca, feed y listas, incluidos errores de escritura. Las capturas se guardan en `.expo/reading-preview`.

```powershell
pnpm exec expo start --web --port 8082
$env:LEXA_BROWSER_MODULES = 'ruta/absoluta/a/node_modules/con/playwright'
node scripts/check-reading-preview.cjs
```

`LEXA_READING_PREVIEW_URL` permite cambiar el origen. La revisión web no sustituye la comprobación de teclado y áreas seguras en una compilación instalada de Android/iOS.

---

### Reseñas, spoilers y comentarios

#### Alcance y entradas

Reseñas y comentarios se mantienen en el lanzamiento del MVP. Un lector puede publicar una reseña por libro, editarla y retirarla. El editor se abre desde la ficha y desde Mis reseñas; carga el libro y la reseña existente antes de permitir guardar. Un error de carga no se presenta como formulario nuevo.

`app/review/new.tsx` y `app/comments/[id].tsx` solo exportan sus pantallas, conforme a la arquitectura de rutas. `SpoilerText` se comparte entre ficha, feed, listas de reseñas y comentarios para que la protección sea la misma. `ConfirmDialog` aporta confirmación, cancelación y reintento al retirar reseñas/comentarios o descartar una edición. No se añaden aliases ni wrappers sin comportamiento.

#### Reseñas y borradores

- El cuerpo se recorta en los extremos y requiere de 10 a 10 000 caracteres. El cliente y PostgreSQL validan los límites.
- Un índice único parcial impide dos reseñas activas del mismo usuario y libro. Una carrera entre editores produce un error visible en lugar de duplicar la reseña.
- Editar conserva el identificador; registra `edited_at`. Una publicación crea su actividad en la misma transacción y editar no produce otro evento.
- El borrador permanece ante un error de guardado o un refetch en segundo plano. El envío bloquea pulsaciones repetidas.
- El botón Cerrar pide confirmar si hay cambios sin guardar. El recorrido de gestos y botones del sistema debe verificarse en la compilación nativa antes del lanzamiento.
- Retirar una reseña requiere confirmación, no elimina la puntuación del libro y deja de exponer la reseña, su actividad y sus comentarios. Se puede escribir una nueva reseña después.
- Las mutaciones refrescan ficha, Mis reseñas, listas públicas de reseñas, perfil, contadores, feed y contexto de las conversaciones.

#### Protección de spoilers

`SpoilerText` no monta el cuerpo del texto cuando está protegido. Esto lo retira también del árbol accesible, en lugar de ocultarlo solo con desenfoque o color. El lector debe pulsar **Mostrar spoiler** y puede volver a ocultarlo. Cambiar de contenido o editar la reseña vuelve a protegerlo, también cuando una lista recicla la tarjeta.

La protección se usa en el feed, la ficha del libro, Mis reseñas, las reseñas de un perfil y los comentarios. El contrato del feed conserva `contains_spoilers`; una reseña no publicada o eliminada no aporta texto de preview. La tarjeta que se exporta al compartir sustituye siempre un cuerpo marcado por un aviso, aunque el lector ya lo haya revelado en pantalla.

Una conversación que pertenece a una reseña con spoilers pide consentimiento antes de consultar o mostrar sus comentarios. Cada comentario puede marcarse además individualmente. Esta protección depende de las marcas elegidas por el autor: no intenta detectar spoilers automáticamente. Es un control de presentación; los cuerpos se reciben por API una vez autorizado el acceso al contenido.

Las notificaciones actuales de comentarios contienen referencias al contenido, no una copia del cuerpo. No se añade texto sensible a sus títulos ni previews.

#### Comentarios y permisos

El hilo muestra carga, vacío, error con Reintentar y paginación con cursor compuesto `(created_at, id)`. Usa FlashList y los tokens del design system. Un fallo de envío conserva texto y marca de spoiler; no se limpia el campo hasta que el servidor confirma el éxito. Los comentarios propios se retiran con confirmación y admiten reintento.

El acceso al hilo se comprueba antes de habilitar el formulario. Un padre inexistente, eliminado o inaccesible muestra **Contenido no disponible**. Esta comprobación de UI acompaña la autorización del servidor; conocer el ID no da permiso.

Las políticas RLS exigen acceso al contenido padre tanto al leer como al crear comentarios. Se comprueban privacidad, seguidores aceptados, bloqueos y usuarios eliminados. El feed de una reseña también exige que siga publicada y visible. Las respuestas no pueden apuntar a comentarios de otro contenido ni los comentarios cambiar de propietario o hilo. La interfaz del MVP ofrece comentarios principales; no añade un editor de respuestas anidadas.

#### Migraciones y borrado lógico

Se aplicaron y se regeneraron los tipos de Supabase:

- `20261020162508_reviews_comments_mvp.sql`: unicidad, validación, publicación, marca de spoilers y permisos heredados.
- `20261020163158_owned_content_soft_delete.sql`: operación de retirada restringida al propietario.

PostgreSQL no permite una actualización ordinaria que deje la fila fuera de su política de selección en este recorrido. `public.remove_own_content` es una entrada `SECURITY INVOKER`; delega la actualización en `lexa_social.remove_own_content`, una función `SECURITY DEFINER` de un esquema que debe mantenerse fuera de los esquemas expuestos por PostgREST. Exige `auth.uid()`, comprueba el propietario dentro de la actualización, acepta solo reseñas/comentarios y devuelve un booleano sin revelar cuerpos ni datos ajenos. El acceso anónimo está revocado y `search_path` permanece vacío.

Los contadores siguen calculándose mediante los triggers existentes, sin incrementos manuales desde el cliente. Las lecturas normales no muestran filas retiradas ni al propio autor.

Se comprobó que `lexa_social` no está expuesto por la Data API (`PGRST106`, esquema no válido). El análisis de seguridad no añadió avisos respecto de los que ya tenía el proyecto.

#### Evidencia y límites

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

---

### Perfiles, seguimiento y privacidad

#### Experiencia del lector

El perfil propio y el ajeno comparten identidad, avatar, tipografía editorial y contadores. Se elimina el degradado del perfil ajeno y la tarjeta que encerraba toda la identidad propia. Las lecturas y listas mantienen los componentes del design system; los controles tienen estados de carga, error, foco y áreas táctiles adecuadas. La comunidad se adapta al ancho disponible y conserva el estado real de seguimiento, incluida la ausencia de una acción para seguirse a uno mismo.

La edición del perfil permite cambiar nombre, biografía, géneros y cuenta privada. Si falla el guardado, mantiene el formulario y permite reintentar. Las solicitudes recibidas aparecen en el perfil propio: aceptar concede acceso y rechazar retira la solicitud sin incrementar los contadores ni notificar al solicitante.

El perfil de otra persona distingue entre seguir, solicitar seguimiento, cancelar solicitud y dejar de seguir. Esta última acción requiere confirmación e informa sobre la pérdida de acceso si la cuenta es privada. Las listas del lector se consultan realmente y abren su `slug`; ya no se renderiza una colección vacía fija. Los errores y perfiles no disponibles tienen un estado explícito.

#### Contrato de privacidad

- La identidad pública incluye nombre, usuario, avatar, biografía, géneros y contadores. Una cuenta privada reserva sus registros de lectura, reseñas publicadas, listas públicas y relaciones de comunidad al propietario y a seguidores aceptados. Las listas individuales privadas siguen siendo exclusivas de su propietario.
- El servidor obtiene la privacidad actual del destinatario. Insertar `accepted` desde un cliente modificado contra una cuenta privada produce `pending`. El cliente no puede aprobar su propia solicitud, cambiar los participantes ni alterar la fecha de creación.
- Solo el destinatario puede cambiar una solicitud pendiente a aceptada. El servidor establece `accepted_at`. Ambos participantes pueden retirar la relación: el solicitante cancela o deja de seguir, y el destinatario rechaza o retira un seguidor.
- Los contadores incluyen únicamente relaciones aceptadas. La migración corrige los totales anteriores; los triggers mantienen inserciones, aprobaciones y retiradas sin escrituras manuales desde frontend.
- Hacer privada una cuenta conserva a sus seguidores ya aceptados. Hacerla pública abre su contenido público; no aprueba silenciosamente las solicitudes pendientes. Volver a privada vuelve a exigir una relación aceptada.
- Bloquear elimina seguimientos en ambos sentidos. Desbloquear no los restaura. Las solicitudes pendientes no son visibles a terceros; las relaciones aceptadas respetan los permisos de ambos perfiles.
- Perfiles inexistentes o eliminados no conceden acceso por ausencia de una fila. Los bloqueos se comprueban en ambos sentidos. Las políticas de listas protegen también sus libros mediante las políticas existentes del padre. Reseñas, comentarios y actividad conservan sus comprobaciones de privacidad.

La migración `20261020204044_profile_follow_privacy_mvp.sql` se aplicó en Supabase. Los métodos privilegiados permanecen en el esquema no expuesto `lexa_social`, con `search_path` vacío y ejecución directa revocada para los triggers. `public.can_view_user_content` es un invocador de la comprobación privada, evitando recursión entre políticas.

#### Caché y carga

La UI espera una relación aceptada confirmada por servidor antes de consultar contenido protegido. Revalida el perfil al montarlo y al volver a la pantalla. Mientras comprueba acceso a una cuenta privada, oculta su contenido anterior. Seguir, cancelar, responder, bloquear o cambiar privacidad refresca perfiles, contadores y comunidad y descarta el contenido dependiente de permisos en caché. El optimismo de una nueva solicitud nunca concede por sí solo acceso privado.

Seguidores y seguidos usan FlashList y cursor `(created_at, id)`, con 30 filas visibles y una adicional para detectar continuación. Se consulta solamente la pestaña activa. Un fallo de página adicional conserva las filas cargadas y permite reintentar.

Las tres pantallas modificadas viven en `src/features/user/screens/`; `app/` conserva sus rutas de Expo Router. `FollowButton` se comparte entre perfil y `UserCard`, usado en búsqueda y comunidad. `profile-cache.ts` concentra la invalidación que necesitan seguimiento, solicitudes, bloqueos y edición de privacidad. No se añaden intermediarios de presentación de un solo uso.

#### Verificación y límites

- `supabase/tests/profile-privacy.sql`, ejecutado contra Supabase con `ROLLBACK`: aceptación forzada, identidad inmutable, aprobación legítima, rechazo, retirada, contadores, cuentas públicas/privadas, bloqueo y desbloqueo, anonimato, listas y libros protegidos, y 37 seguidores con fechas empatadas repartidos en dos páginas sin omisiones ni duplicados.
- `supabase/tests/reviews-comments.sql`, vuelto a ejecutar con relaciones creadas mediante el flujo autorizado: privacidad, bloqueos, comentarios y eliminación conservan sus garantías.
- `scripts/check-profile-preview.cjs`: cliente real en navegador con HTTP simulado. Comprueba ausencia de consultas protegidas antes de aprobar, errores con reintento, persistencia de solicitudes al recargar, cancelación, confirmación al dejar de seguir, revocación de acceso al volver desde otra pantalla, aceptación/rechazo, edición con error, perfiles no disponibles y anchos de 320/390/1280 px en claro/oscuro.
- Los recorridos anteriores de registro de lectura y reseñas/comentarios continúan aprobados. TypeScript, lint, formato y 48 pruebas unitarias/de componentes verificados. Las cuatro suites de integración antiguas que necesitan credenciales en `.env.test` permanecen fuera de esta ejecución; la seguridad específica se verificó con los dos scripts SQL reales anteriores.
- Los avisos de seguridad de Supabase no identifican nuevos hallazgos para las funciones añadidas. Persisten los avisos previos del proyecto, fuera de este punto del MVP.

Pendiente de lanzamiento: compilación instalada en Android/iOS, VoiceOver/TalkBack, escalado de fuente, teclado y navegación nativa. Este punto no marca como completos el feed, notificaciones push ni todo el módulo de bloqueo/reporte y gestión de cuenta, que siguen teniendo sus propios puntos del MVP.

---

### Listas básicas

#### Experiencia

El perfil abre las listas por su enlace estable. El detalle muestra portadas, nombre, descripción, visibilidad y libros en filas legibles. Usa BookCover, ConfirmDialog, los colores semánticos, las fuentes y los radios del design system en claro y oscuro. Se retiran el degradado, los controles de cristal, los colores locales y las franjas decorativas. Las acciones principales tienen objetivos táctiles de 48 px y foco visible.

Crear y editar comparten formulario: nombre de 2 a 60 caracteres, descripción opcional de hasta 200 y visibilidad. Las listas nuevas empiezan privadas. Una lista pública respeta además la privacidad de la cuenta; el formulario lo explica. Renombrar no cambia el slug. Un fallo mantiene el borrador y la acción de volver/cancelar pide confirmación si hay cambios. La confirmación cubre los controles de la pantalla; el historial del navegador y los gestos de navegación nativos requieren validación adicional.

El propietario puede buscar y añadir libros desde el propio detalle, sin abandonar la lista. Se reutiliza la búsqueda existente y su caché de libros. Los libros añadidos se indican con una marca y no se duplican. Quitar un libro requiere confirmación y solo elimina su relación con la lista, no el libro ni su registro de lectura. El título abre su ficha y «Registrar lectura» mantiene disponible el editor compartido.

Desde la ficha de un libro, el selector consulta su pertenencia real. Marcar añade; desmarcar quita. La selección persiste al recargar y los errores permiten reintentar. Crear una lista desde este selector conserva el contexto del libro y vuelve al selector para elegirla.

Eliminar una lista utiliza la confirmación compartida con estado de espera y error. Los estados vacíos enseñan la siguiente acción, los errores de consulta ofrecen reintento y una lista inexistente o inaccesible muestra un mensaje explícito. El editor rechaza URLs de listas ajenas.

#### Datos y permisos

- Se mantienen las políticas RLS existentes: solo el propietario crea y modifica sus listas y sus libros; la lectura pública respeta cuenta privada, seguidores aceptados y bloqueos.
- `20261020215902_basic_lists_mvp.sql` añade límites de nombre/descripción y `add_list_book`. El RPC es SECURITY INVOKER, usa search_path vacío y solo se concede a authenticated. Verifica propiedad, bloquea la fila de lista durante la incorporación, calcula la siguiente posición desde el máximo y usa la restricción única para evitar duplicados. No confía en el contador como posición.
- Los triggers existentes mantienen books_count. El cliente no escribe contadores.
- `20261020220617_restore_list_metadata.sql` recupera is_featured y accent_color: existían en la migración histórica 009 y en el cliente, pero faltaban en la base desplegada. Se regeneraron los tipos y se retiraron casts de las consultas modificadas que ocultaban esa discrepancia.
- Las escrituras refrescan detalle, selector, portadas y contadores del perfil mediante claves derivadas de las factorías. El detalle separa la caché por lector y revalida permisos al regresar. El estado de «me gusta» se obtiene del servidor.
- Las consultas de colecciones mantienen el alcance básico existente; esta entrega no incorpora reordenación manual, listas colaborativas ni navegación incremental para grandes colecciones. La API conserva su límite de filas configurado. FlashList virtualiza la presentación.

#### Organización

Las rutas de app/ solo reexportan las pantallas de src/features/lists/screens, como exige CLAUDE.md. Crear y editar usan la misma pantalla y formulario para compartir comportamiento y validación. ListControls comparte cabecera, acciones con estado/foco y skeleton entre las tres pantallas. No hay wrappers de un solo consumidor para acortar archivos.

#### Verificación

- `supabase/tests/basic-lists.sql`, ejecutado contra Supabase y revertido: crear, editar, límites, destacar, alta idempotente, orden después de una retirada, contadores, protección de escrituras ajenas, visibilidad privada y borrado en cascada que conserva el catálogo.
- `supabase/tests/profile-privacy.sql`: regresión real de acceso por privacidad, seguimiento y bloqueo.
- Consultas HTTP a la API real: selección de campos y relaciones de lists, list_books y list_likes responde correctamente, incluidos los campos recuperados.
- `scripts/check-lists-preview.cjs`: cliente real con transporte HTTP simulado. Creación y edición, errores de guardado/alta/retirada/eliminación, selección tras recargar, creación desde el libro, descarte de borrador, editor ajeno, consulta fallida con reintento, lista no disponible, vacíos y anchos 320/390/1280 px en claro/oscuro.
- `scripts/check-reading-preview.cjs`: regresión del registro de lectura desde búsqueda, biblioteca, feed y listas, además de ficha y meta anual.
- TypeScript, lint, formato del código modificado, tokens y 48 pruebas unitarias/de componentes. Las cuatro suites antiguas que requieren credenciales en .env.test siguen excluidas; las pruebas de permisos anteriores se ejecutan en la base real.
- Los advisors no señalan la nueva función; permanecen los avisos anteriores del proyecto.

Pendiente antes de lanzamiento: compilación instalada en Android/iOS, teclado y navegación nativa, VoiceOver/TalkBack y tamaños de fuente ampliados en dispositivos.
