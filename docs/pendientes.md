# Pendientes — Lexa Reads

Este es el **único documento operativo de pendientes** del proyecto. Marca y
actualiza las tareas aquí; los demás documentos describen arquitectura,
decisiones, procedimientos o evidencia y enlazan a esta lista.

Los elementos se ordenan por el orden razonable de salida. Una tarea marcada
solo debe cerrarse cuando se registre la evidencia indicada en el documento
enlazado o en el PR correspondiente.

---

## 1. Bloqueadores para una beta instalada

- [ ] Promover el administrador
      inicial y publicar los deep links restantes. Push y firma ya están desplegados. Seguir
      [el runbook de despliegue](despliegue.md).
- [ ] Completar la build de EAS y generar una
      APK interna para Android. Acceso propietario restablecido; registrar el identificador de build y el
      resultado de instalación.
- [ ] Recorrer en el Android instalado Registro, biblioteca, ficha de libro,
      Ajustes y consentimiento. Probar TalkBack, texto ampliado, pantalla pequeña,
      error de red y recuperación. Criterios y antecedentes en
      [verificación de accesibilidad y publicación](verificacion-accesibilidad-y-publicacion.md).
- [ ] Completar los datos reales de publicación en `public/legal/release-info.json`,
      obtener revisión legal y publicar los documentos aprobados, privacidad y
      licencias. Seguir [la guía legal](../public/legal/README.md).
- [ ] Verificar desde Registro y Ajustes todos los enlaces legales publicados
      en una instalación real.

## 2. Seguridad, moderación y datos de cuenta

- [ ] Validar en Supabase y Android el bloqueo de usuarios de extremo a extremo:
      autorización por RLS, efecto recíproco en perfiles, seguimiento y contenido,
      caché sin datos revocados y estados de carga, error y vacío.
- [ ] Validar reportes de usuarios y contenido: autorización y tipos en
      servidor, control de duplicados y abuso, confirmación tras persistir y ciclo
      de moderación con responsable y SLA definidos.
- [ ] Completar y probar la exportación de datos: inventario acordado,
      paginación, errores visibles, formato versionado y comportamiento correcto
      con cuentas voluminosas.
- [ ] Completar y probar solicitud, cancelación y ejecución de eliminación de
      cuenta: idempotencia, revocación de sesiones, limpieza local, trabajo
      programado, dependencias de Auth/Storage y comunicación al usuario.
- [ ] Ejecutar las pruebas de integración y el recorrido Android de los cuatro
      flujos anteriores. El detalle técnico y los criterios de aceptación viven en
      [el plan de seguridad y datos](plan-seguridad-y-datos-de-cuenta.md).

## 3. Recorrido esencial del producto

- [x] Integrar las pantallas existentes con el sistema de Stitch
      con tema y componentes compartidos. Conservar
      las diferencias funcionales documentadas en [la adopción de Stitch](stitch-adoption.md).

- [ ] Probar en Android la búsqueda por ISBN, su fallback de alta y el escáner
      de cámara ya implementados.
- [ ] Comprobar en Android que el registro llega al feed sin onboarding y que el
      lector puede completar su perfil y seguir personas después.
- [ ] Probar enlaces y push de extremo a extremo para las notificaciones
      navegables incluidas en el lanzamiento.
- [x] Traducir las superficies migradas y las fechas; comprobar
      español e inglés (921 claves en cada catálogo). Auditar textos históricos fuera de este lote antes de publicación.

## 4. Calidad y operación antes de producción

- [x] Crear el workflow de calidad para tipos, tokens, lint, formato del cambio,
      129 pruebas de la app y el contrato Deno de cuenta. La ejecución remota
      comenzará al subir los commits; no incluye suites RLS sin credenciales.
- [ ] Añadir Maestro al camino crítico de alta, búsqueda, biblioteca, reseña y reacción.
- [ ] Añadir controles de abuso en registro, mensajes y funciones remotas;
      revisar los límites con pruebas de servidor.
- [ ] Configurar observabilidad con consentimiento: analítica, captura de
      errores, alertas de reportes y supervisión de disponibilidad.
- [ ] Decidir y documentar copias de seguridad/PITR, actualizaciones OTA y la
      estrategia de versión mínima.
- [ ] Ejecutar una prueba de carga proporcionada al feed y revisar las consultas
      de bandeja de mensajes antes de abrir la beta.

## 5. Envío a tiendas

- [ ] Preparar iconos, splash y capturas de tienda para los idiomas soportados.
- [ ] Completar las declaraciones de datos de App Store Connect y Play Console.
- [ ] Generar la build de producción, validar Internal Testing/TestFlight y
      conservar la evidencia de la versión enviada.

## Completado y pendiente de validación física

- [x] Incorporar las superficies nuevas de Stitch: menú Comunidad, vista previa
      de compartir, hojas y estados compartidos, recuperación de errores de chat,
      clubes y notificaciones, y confirmación real del cambio de contraseña.
      Evidencia y límites de las comprobaciones en [la adopción de Stitch](stitch-adoption.md).

- [x] Aplicar en Supabase las migraciones remotas de catálogo comunitario,
      metadatos y voto de portadas, y sugerencias de seguimiento en onboarding.
      El cron de finalización de portadas quedó corregido con expresión válida
      de cinco campos y las migraciones aparecen aplicadas en el proyecto.
- [x] Revisar la compatibilidad declarada del proyecto con Expo mediante
      `expo install --check`.
- [x] Implementar búsqueda por ISBN-13, fallback de alta del catálogo y escáner
      de cámara para EAN-13. Las pruebas automatizadas pasaron; falta Android.
- [x] Implementar sugerencias de lectores durante el onboarding y en el feed
      inicial para evitar una primera pantalla vacía.
- [x] Limitar la bandeja a tipos de notificación que el MVP puede mostrar o
      abrir, y mantener la paginación por cursor compuesto.
- [x] Corregir la generación de tokens del design system para que
      `gen:theme`, `check:theme` y el formato del repositorio coincidan.
- [x] Corregir la lista de bloqueados para que use una RPC limitada al propio
      bloqueador y siga siendo desbloqueable aunque RLS oculte el perfil.
- [x] Publicar `delete-account` y `export-user-data` con verificación JWT en
      Supabase. La exportación pagina las colecciones y declara la versión de
      formato; la solicitud de eliminación es idempotente y revoca sesiones.
      Falta validación con una cuenta real y Android antes de cerrar los flujos.
- [x] Centralizar el envío de reportes en la RPC `submit_report`, aplicada en
      Supabase. Valida tipo, objetivo, motivo y longitud, limita diez reportes
      por día y evita duplicados activos; la interfaz conserva el borrador si
      falla. Falta el recorrido con moderador y Android para cerrar el flujo.

## Diferido a propósito

No iniciar estos trabajos sin señales de uso de la beta: importación de
Goodreads, wrap-up y estadísticas, retos, recomendaciones entre amigos,
progreso/diario/citas, clubes y chat públicos, buddy reads, IA, imágenes de
citas y modo offline completo. El alcance y las decisiones previas permanecen
documentados en [STACK](STACK.md) y [el plan de evolución](PLAN_MVP_Y_EVOLUCION.md).
