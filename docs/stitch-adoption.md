# Adopción de Stitch en Lexa

## Fuente y alcance

Referencia: proyecto Stitch `5926642661453102120`, «App Planning and Design», con 47 pantallas de interfaz. La primera entrega incorporó las superficies faltantes. El usuario autorizó después extender el sistema a las pantallas existentes y delegar la implementación, con integración y validación a cargo del agente principal.

El tema compartido vive en `src/theme/tokens.json`: Newsreader para títulos, Inter para interfaz, superficies tonales y acción principal de tinta con `onAccent`. `useStitchTheme` adapta esa misma paleta. Se retiraron las dependencias de Playfair Display y DM Sans; se cargan nueve pesos de las dos familias utilizadas.

## Implementación

- Navegación: `AppHeader` compartida y barra de cinco pestañas con etiquetas traducidas, estado seleccionado, contador real y eventos de React Navigation.
- Acceso: bienvenida, registro, inicio de sesión, recuperación, confirmación, cambio de contraseña y pasos de personalización. Campos y botones usan los tokens compartidos. La bienvenida utiliza cubiertas tipográficas locales: la imagen remota de referencia aparecía como un bloque oscuro en la comprobación web.
- Catálogo: búsqueda y filtros, alta y escáner, ficha de libro, metadatos y votación de portada. Biblioteca en dos columnas, controles de lectura, listas y editor de reseñas con portada real.
- Comunidad: inicio y comentarios, bandeja, mensajes y citas tonales, clubes, detalle y alta, bandeja de notificaciones.
- Cuenta: perfiles, solicitudes de seguimiento, edición, bloqueados, reportes, consentimiento y ajustes. Las rutas de Expo Router delegan sus pantallas a `src/features`.
- Superficies nuevas: menú Comunidad, vista previa de compartir, hojas, botones, mensajes de carga, error y vacío, confirmaciones destructivas y permiso contextual de push.

Los fallos de guardado conservan borradores. El chat reconcilia respuestas y Realtime sin duplicar mensajes ni restaurar cachés antiguas. Las tarjetas compartidas esperan a que la portada esté preparada y excluyen spoilers. El cambio de contraseña verifica la actual y protege la navegación mientras guarda. Los estados de carga respetan reducir movimiento.

## Diferencias funcionales deliberadas

Una captura no crea una función de producto. No se añadieron planes de pago, exportación CSV, formato enriquecido, guardado automático, llamadas, indicadores de escritura, filtros algorítmicos, estadísticas ficticias ni roles de club sin contrato real. Se conservan los cinco destinos de Lexa aunque alguna referencia muestre cuatro. Se usan portadas, nombres y contadores del catálogo y la cuenta, con alternativas explícitas.

## Revisión y servidor

Un coordinador delegó áreas independientes y revisó sus entregas. El agente principal integró los cambios, repitió las comprobaciones y guardó commits por responsabilidad.

Las pruebas de servidor detectaron dos defectos reales: los permisos de tabla anulaban las restricciones por columna y el alta de un DM no podía leer su ID antes de crear sus miembros. Las migraciones aplicadas limitan INSERT/UPDATE en cinco tablas y permiten leer los metadatos del propio par DM activo y sin bloqueo; no amplían acceso a mensajes. Las pruebas SQL usan cuentas sintéticas y terminan en rollback.

`delete-account` v3 está activo con verificación JWT y revoca sesiones usando el token validado, también al reintentar. No se solicitó el borrado de ninguna cuenta real durante la prueba.

`send-push` v2 está activo. El trigger firma ID y fecha mediante HMAC; la clave permanece en Vault. La RPC de verificación solo permite al backend comprobar la firma. El handler relee el evento persistido, consentimiento, preferencias, estado de las cuentas y bloqueos antes de llamar a Expo. El endpoint rechaza solicitudes sin firma (HTTP 403); `delete-account` sin autenticación responde 401.

La cola de pg_net es administrada por Supabase y sus ACL no pudieron restringirse desde `postgres`. Por eso la versión final no transporta la clave compartida en la cola. Una firma permite repetir el mismo evento durante cinco minutos; aún faltan deduplicación durable, reintentos y recibos de entrega. No se enviaron notificaciones a dispositivos reales como prueba.

## Evidencia y límites

- TypeScript y comprobación de tokens correctos; lint estricto del código modificado y formato de los archivos modificados.
- Veintisiete suites Jest, con 130 pruebas, sobre navegación, fechas por idioma, contraste claro/oscuro, formularios, chat/caché, compartir/spoilers, recuperación de estadísticas y permiso push. Las suites RLS que requieren credenciales no se cuentan como cobertura de servidor.
- Dos pruebas Deno del handler real de cuenta con SDK y transporte aislado.
- `.github/workflows/quality.yml` ejecuta tipos, tokens, lint, formato del cambio, pruebas de la app y contrato Deno al recibir push o una pull request. Está preparado; no se ha ejecutado en GitHub durante esta sesión.
- Cinco comprobaciones SQL reales: ciclo de cuenta, columnas de participantes, arranque de DM, permisos efectivos de cinco tablas y firmas HMAC válidas/adulteradas/caducadas. Rollback sin enviar mensajes, notificaciones o solicitudes HTTP. La prueba HMAC desplegada no modifica Vault ni devuelve su clave.
- Español e inglés contienen las mismas 921 claves. Las fechas siguen el idioma elegido; los mensajes del servidor push siguen en español hasta disponer de idioma persistido por destinatario.
- Exportación web de producción desde caché limpia, con configuración pública de Lexa. El contraste de los roles textuales se comprueba automáticamente sobre las cuatro superficies en ambos temas.
- Inspección visual web a 390 × 844 de bienvenida, acceso y registro, sin crear una cuenta ni aceptar documentos legales. Se corrigió el bloque oscuro de la imagen de bienvenida observado durante esta revisión.
- La compilación limpia descubrió dos dependencias no declaradas: `babel-preset-expo` y `react-native-worklets`. Se añadieron directamente; Worklets usa 0.5.1, la versión indicada por Expo SDK54. EAS usa Node22.14 y pnpm10.33.2. `expo install --check` mantiene un aviso sobre la declaración fijada de React Navigation7.2.5 frente al rango recomendado `^7.1.8`; se conserva la misma versión efectiva del navegador.

La comprobación web no certifica paridad visual exhaustiva de las 47 referencias ni comportamiento de cámara, compartir, TalkBack o push en dispositivo. La validación física queda pendiente de publicación y no bloquea la implementación, por instrucción del usuario. El estado de builds y los requisitos externos se mantienen en [pendientes](pendientes.md).
