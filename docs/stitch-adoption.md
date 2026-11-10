# Adopción gradual del diseño de Stitch

## Decisión

Las superficies nuevas utilizan el sistema del proyecto [Lexa en Stitch](https://stitch.withgoogle.com/projects/5926642661453102120). Las pantallas existentes conservan el sistema actual hasta una migración posterior. No cambiar globalmente `tokens.json`, las clases NativeWind ni Playfair Display/DM Sans para adoptar un componente nuevo.

`src/theme/stitch.ts` reúne los tokens usados por las superficies nuevas. Newsreader presenta títulos e Inter se utiliza en controles y texto. Las fuentes se cargan al montar estas superficies. El modo claro procede del tema exportado de Stitch; el oscuro sigue las superficies carbón descritas en su design system. Su composición visual requiere validación en dispositivo.

Las pantallas ampliadas de feed, notificaciones, mensajes y clubes se ubican en `src/features/*/screens/`. Sus archivos de `app/` conservan únicamente la entrada de Expo Router. El traslado cumple la regla arquitectónica de `CLAUDE.md`, no responde al tamaño de los archivos ni introduce intermediarios internos.

## Comparación funcional

La revisión del proyecto encontró 47 diseños de interfaz, además de una referencia de imagen y el documento funcional. Se comparó su inventario con las rutas y componentes del repositorio y `Lexa.md`. El documento local ya existía sin seguimiento y no forma parte de los commits de esta implementación.

| Grupo                   | Implementación existente                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| A01–A09, acceso         | `src/features/auth/screens/`                                                                            |
| Inicio                  | Feed, tarjetas de actividad, sugerencias y opciones de publicación                                      |
| C01–C07, catálogo       | Buscar, filtros, escáner, alta, detalle y sus cuatro pestañas, ficha rápida y votación de portadas      |
| D01, biblioteca         | Biblioteca, estados, valoración y fechas compartidas                                                    |
| E01–E04, reseñas        | Editor, reseñas propias/ajenas y comentarios con protección de spoilers                                 |
| F01–F05, lectores       | Perfiles, edición, seguidores y solicitudes de seguimiento                                              |
| G01–G04, listas         | Creación, edición, detalle y selector de pertenencia                                                    |
| H01–H02, notificaciones | Listado y activación contextual                                                                         |
| I01–I03, mensajes       | Bandeja, conversación y aceptación/rechazo de solicitudes                                               |
| J01–J04, clubes         | Listado, creación, detalle y chat según membresía                                                       |
| K01–K09, ajustes        | Ajustes, consentimiento, bloqueos, reportes, eliminación diferida, exportación y pantalla de contraseña |
| L01–L04                 | Pantallas de onboarding conservadas                                                                     |
| Compartir               | Tarjetas de libro y reseña con protección de spoilers                                                   |

La ausencia de un diseño en Stitch no significa que falte la pantalla en el código. No se han duplicado rutas existentes. Este inventario comprueba cobertura, no certifica visualmente ni funcionalmente todos los recorridos anteriores.

## Superficies añadidas

- Vista previa de tarjeta antes de compartir, desde el detalle de libro y sus reseñas. Reutiliza las piezas exportables actuales; su rediseño queda para la migración de componentes existentes. No incorpora un destino principal ni formatos adicionales. Conserva la tarjeta al fallar y permite reintentar.
- Menú Comunidad desde Inicio: accesos a Clubes y Mensajes, cierre exterior y cierre explícito. Los destinos actuales se mantienen.
- Botones, hojas, cargas estructurales y avisos de estado de Stitch compartidos por las superficies nuevas.
- Chat: errores iniciales y de paginación, conservación del borrador y la cita al fallar, bloqueo del doble envío, opciones accesibles y confirmación de borrado con reintento. Las citas de mensajes eliminados muestran el marcador en lugar del texto retirado.
- Conversación privada: comprobación de acceso antes de habilitar el compositor y estados de solicitud pendiente, error y conversación no disponible. Cambiar de conversación no reutiliza el borrador de otra.
- Bandeja y clubes: errores recuperables diferenciados de listas vacías, conservación de datos al fallar una actualización y acciones para continuar desde los vacíos.
- Notificaciones: explicación del permiso en una hoja contextual, rechazo o plataforma sin soporte sin confirmación falsa de activación, guardado con reintento y errores de carga/paginación. No se muestra el aviso si el lector había desactivado todas las categorías push.
- Clubes: confirmación antes de salir, error recuperable de membresía, chat no disponible sin ofrecer una unión duplicada y formulario de creación con límites, procesamiento y conservación de datos al fallar.
- Contraseña: el botón de Ajustes ahora verifica `current_password` en el servidor y confirma únicamente tras `auth.updateUser`. Se conserva el formulario ante un fallo y se evita el doble envío. La pantalla se ubica en `src/features/auth/screens/` y la ruta queda en `app/` para respetar la frontera arquitectónica al conectar comportamiento real.
- Ajustes de notificaciones: la activación comparte la explicación contextual; la desactivación no solicita permiso, los fallos de carga no habilitan controles con valores supuestos y la ausencia real de preferencias tiene explicación propia.

## Revisión cruzada

Tres agentes revisaron áreas independientes y el agente principal inspeccionó e integró sus diffs y volvió a ejecutar sus comprobaciones. Se corrigieron además la reconciliación del mensaje confirmado con la caché y Realtime, fallos parciales de metadatos que se confundían con ausencia de acceso, dobles confirmaciones, el cambio de cita durante un envío y el retorno de la confirmación de contraseña.

La exportación ahora espera a `Image.onDisplay` o al layout de la cubierta alternativa y mantiene la vista montada mientras comparte. La atribución es «Compartido por» y no presupone que el libro esté leído. Los imports de las nuevas fuentes se limitan a los tres pesos utilizados.

## Diferencias y dudas para la migración posterior

- Ajustes de Stitch menciona «Plan Lector» y formatos CSV/JSON. No corresponden al producto actual y no deben trasladarse.
- La muestra de detalle de lista tiene cuatro destinos inferiores; Lexa requiere cinco, incluyendo Notificaciones.
- El editor de reseña dibuja controles de formato y guardado automático del borrador. No están descritos en el contrato funcional y no se implementan por asociación visual.
- Algunas portadas de las muestras contienen capturas completas de una pantalla en lugar de la cubierta del libro. Deben usarse los datos reales del catálogo y su fallback.
- Las capturas descargadas de Inicio y Ficha rápida se recibieron casi negras, mientras que su HTML sí contiene contenido. No se ha tomado esa captura como referencia cromática; se revisaron su HTML y el tema del proyecto.
- La nota histórica de `Lexa.md` sobre el botón de contraseña sin conectar queda superada por esta implementación. La llamada usa el campo `current_password`, documentado por Supabase para supabase-js 2.102.0 o posterior y admitido por la versión instalada. No se ha cambiado una contraseña real durante las comprobaciones. Si el proyecto exige reautenticación adicional, la interfaz conserva el formulario y muestra el error; el flujo por correo sigue separado.
- No se ha ejecutado una migración general de las pantallas existentes ni una revisión visual exhaustiva en emulador. El envío nativo de imágenes requiere comprobarse en iOS/Android; una plataforma sin soporte recibe un error recuperable.
- El cambio de credenciales utiliza `usePreventRemove` para bloquear las acciones que retiren su pantalla de React Navigation mientras guarda. El bloqueo se desactiva si termina la sesión para no interferir con la salida de una pantalla privada. Se declara directamente la misma versión de React Navigation que ya utilizaba Expo Router, sin actualizar el navegador existente.

## Verificación de esta entrega

- `pnpm.cmd typecheck`: correcto.
- ESLint sobre todos los archivos de código modificados, con `--max-warnings 0`: correcto.
- Prettier sobre el código y los documentos modificados: correcto.
- Catorce suites focalizadas, con 41 pruebas, pasan sobre la integración final. Cubren compartir y spoilers, navegación, borradores y reconciliación del chat, acciones destructivas, errores frente a vacíos, permiso push, ajustes y confirmación del cambio de contraseña. La prueba de salida durante el guardado utiliza el router real de React Navigation, sin sustituir su mecanismo de bloqueo. Las suites de servidor/RLS no forman parte de este recuento.
- Español e inglés tienen las mismas 743 claves, sin faltantes en ninguno de los dos catálogos.
- La exportación web de producción de Expo termina correctamente después de integrar los cambios y separar las rutas.
- `git diff --check`: correcto.
- La validación física se documenta como evidencia pendiente para publicación y no bloquea esta implementación, siguiendo la indicación del usuario. Las pruebas de componentes no certifican la entrega de push ni un cambio de credenciales contra una cuenta real.
