# Adopción gradual del diseño de Stitch

## Decisión

Las superficies nuevas utilizan el sistema del proyecto [Lexa en Stitch](https://stitch.withgoogle.com/projects/5926642661453102120). Las pantallas existentes conservan el sistema actual hasta una migración posterior. No cambiar globalmente `tokens.json`, las clases NativeWind ni Playfair Display/DM Sans para adoptar un componente nuevo.

`src/theme/stitch.ts` reúne los tokens usados por las superficies nuevas. Newsreader presenta títulos e Inter se utiliza en controles y texto. Las fuentes se cargan al montar estas superficies. El modo claro procede del tema exportado de Stitch; el oscuro sigue las superficies carbón descritas en su design system. Su composición visual requiere validación en dispositivo.

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

## Diferencias y dudas para la migración posterior

- Ajustes de Stitch menciona «Plan Lector» y formatos CSV/JSON. No corresponden al producto actual y no deben trasladarse.
- La muestra de detalle de lista tiene cuatro destinos inferiores; Lexa requiere cinco, incluyendo Notificaciones.
- El editor de reseña dibuja controles de formato y guardado automático del borrador. No están descritos en el contrato funcional y no se implementan por asociación visual.
- Algunas portadas de las muestras contienen capturas completas de una pantalla en lugar de la cubierta del libro. Deben usarse los datos reales del catálogo y su fallback.
- Las capturas descargadas de Inicio y Ficha rápida se recibieron casi negras, mientras que su HTML sí contiene contenido. No se ha tomado esa captura como referencia cromática; se revisaron su HTML y el tema del proyecto.
- Cambiar contraseña desde Ajustes sigue pendiente de conexión; `Lexa.md` lo describe explícitamente. Requiere un trabajo de autenticación separado, no una confirmación de éxito simulada.
- No se ha ejecutado una migración general de las pantallas existentes ni una revisión visual exhaustiva en emulador. El envío nativo de imágenes requiere comprobarse en iOS/Android; una plataforma sin soporte recibe un error recuperable.

## Verificación de esta entrega

- `pnpm.cmd typecheck`: correcto.
- ESLint sobre los archivos de código modificados: correcto.
- Diez pruebas pasan: vista previa, reintento tras error, cierre, navegación del menú y protección de spoilers.
- `git diff --check`: correcto.
- Falta validación visual en dispositivo y del mecanismo nativo de compartir. Las pruebas de componentes no sustituyen esas comprobaciones.
