# Seguridad, moderación y datos de cuenta

Este documento define el alcance técnico y los criterios de aceptación para
bloqueo, reportes, exportación de datos y eliminación de cuenta. El estado de
cada trabajo se controla únicamente en [Pendientes](pendientes.md).

## Preparación y evidencia

Antes de validar los flujos, comparar migraciones locales con el entorno remoto,
inventariar las tablas, Storage y funciones que intervienen, y preparar cuentas
desechables A/B/C junto con una cuenta moderadora. Acordar por escrito qué datos
se exportan, se anonimizan, se eliminan o se retienen, con base legal y plazo.

Registrar para cada prueba el entorno, versión de la app, cuentas usadas,
resultado, capturas o identificadores relevantes y sus límites.

## Bloqueo

El usuario solo puede crear o retirar sus propios bloqueos. La política del
servidor debe impedir lectura o interacción no autorizada en ambos sentidos
después de bloquear, incluidos perfiles, seguimiento, feed, mensajes y las
rutas que incorporen datos relacionados.

Bloquear elimina los seguimientos existentes; desbloquear no los restaura. La
aplicación descarta la caché que ya no se puede consultar y ofrece estados
claros de carga, error con reintento y lista vacía en la pantalla de bloqueados.
La prueba mínima cubre bloquear, comprobar visibilidad e interacción desde las
dos cuentas, desbloquear y confirmar que no se recuperan relaciones previas.

## Reportes y moderación

Cada punto de entrada para reportar usuarios o contenido debe llegar a un único
modelo de reporte validado en servidor. El servidor establece el reportante,
comprueba el tipo y existencia del objetivo, evita que un usuario común cambie
el estado o la resolución y limita duplicados o abuso.

La interfaz confirma el resultado solo después de guardar y conserva el motivo
y comentario si la operación falla. `docs/moderacion.md` debe nombrar al
responsable, el canal de atención, el proceso de revisión y el SLA publicado.
La evidencia de aceptación sigue un reporte desde el envío hasta su resolución
y comunicación a quien reportó, sin volver a exponer contenido bloqueado.

## Exportación de datos

La exportación incluye el inventario acordado de perfil, biblioteca, registros
de lectura, reseñas, listas, relaciones, preferencias, notificaciones y datos
adicionales que correspondan. Todas las colecciones se paginan y cualquier error
se muestra con una acción de recuperación; nunca se entrega un archivo parcial
como si estuviera completo.

El archivo debe tener formato documentado, versión, fecha, secciones y recuentos
identificables. En web se descarga como JSON; en móvil se comparte o guarda con
las APIs nativas. Se valida con una cuenta pequeña y otra con datos voluminosos
para revisar tiempo, tamaño y memoria.

## Eliminación de cuenta

La solicitud es única mientras está pendiente e idempotente. Al crearla, el
servidor revoca las sesiones con credenciales autorizadas; la aplicación limpia
sesión, cachés y datos locales. Si existe una ventana de gracia, el estado de la
cuenta aplica la restricción acordada y la cancelación resuelve de forma atómica
las carreras con la tarea de eliminación.

El trabajo programado debe manejar Auth, tablas propias, Storage, relaciones y
retenciones definidas, sin que el fallo de una cuenta detenga a las demás. Debe
existir una forma verificable de consultar su programación, última ejecución y
errores. La interfaz explica confirmación, fecha efectiva, cancelación y el
comportamiento tras la eliminación.

## Cierre

Se considera aceptado al completar pruebas de servidor e integración de los
cuatro flujos, ejecutar las comprobaciones configuradas del repositorio y hacer
el recorrido en Android instalado. El punto de salida queda sin cerrar mientras
falten enlaces públicos, build instalable o evidencia de esos recorridos.
