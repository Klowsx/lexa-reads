# Pendientes — Lexa Reads

Este es el **único documento operativo de pendientes** del proyecto. Marca y
actualiza las tareas aquí; los demás documentos describen arquitectura,
decisiones, procedimientos o evidencia y enlazan a esta lista.

Los elementos se ordenan por el orden razonable de salida. Una tarea marcada
solo debe cerrarse cuando se registre la evidencia indicada en el documento
enlazado o en el PR correspondiente.

---

## 1. Bloqueadores para una beta instalada

- [ ] Publicar y configurar las Edge Functions, secretos, webhooks,
      administrador y deep links restantes. Seguir
      [el runbook de despliegue](despliegue.md).
- [ ] Reparar el acceso al proyecto EAS con la cuenta propietaria y generar una
      APK de desarrollo para Android. Registrar el identificador de build y el
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

- [ ] Probar en Android la búsqueda por ISBN, su fallback de alta y el escáner
      de cámara ya implementados.
- [ ] Comprobar en Android el onboarding con sugerencias y el recorrido de una
      cuenta sin contactos.
- [ ] Probar enlaces y push de extremo a extremo para las notificaciones
      navegables incluidas en el lanzamiento.
- [ ] Extraer las cadenas pendientes a los catálogos de traducción y comprobar
      español e inglés.

## 4. Calidad y operación antes de producción

- [ ] Mantener una base de pruebas migrada y automatizar en CI tipos, lint,
      formato y pruebas relevantes; añadir Maestro al camino crítico de alta,
      búsqueda, biblioteca, reseña y reacción.
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

## Diferido a propósito

No iniciar estos trabajos sin señales de uso de la beta: importación de
Goodreads, wrap-up y estadísticas, retos, recomendaciones entre amigos,
progreso/diario/citas, clubes y chat públicos, buddy reads, IA, imágenes de
citas y modo offline completo. El alcance y las decisiones previas permanecen
documentados en [STACK](STACK.md) y [el plan de evolución](PLAN_MVP_Y_EVOLUCION.md).
