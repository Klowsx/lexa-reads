# Acceso por correo y onboarding del MVP

Actualizado: 20 de octubre de 2026.

## Recorrido de acceso

- El registro envía nombre, correo normalizado y contraseña a Supabase.
- Si Supabase devuelve una sesión, el guard consulta el perfil y abre el onboarding pendiente.
- Si la confirmación está activada, se muestra el correo y se permite reenviar con una espera de 60 segundos. No se presupone que la cuenta existe ni se fuerza un ajuste del servidor.
- El retorno de confirmación crea la sesión y continúa con el perfil. Un error del enlace ofrece volver al acceso o solicitar recuperación.
- El cierre normal usa `scope: local`: cierra este dispositivo. La recuperación finaliza con cierre global para revocar las sesiones anteriores.

La configuración pública del proyecto consultada durante este cambio tiene el proveedor de correo activado, registro permitido y confirmación requerida. El código cubre también el caso que devuelve una sesión inmediata.

## Enlaces y configuración de Supabase

El único destino nuevo es `auth-callback`, construido con `Linking.createURL`. Su consulta indica `flow=signup`, `flow=recovery` o `flow=oauth`. Se admite el retorno anterior `auth/callback` para proveedores externos.

Configurar en **Authentication → URL Configuration → Redirect URLs**:

- Compilaciones nativas: `lexa://auth-callback**`.
- Desarrollo con Expo Go: la URL de desarrollo generada por Expo, incluida la ruta `/--/auth-callback`.
- Vista previa web: el origen usado por el servidor local más `/auth-callback**`; el script de comprobación usa `http://localhost:8082`.

La plantilla estándar puede conservar `{{ .ConfirmationURL }}`. Para plantillas que usen `token_hash`, conservar también el tipo de verificación: `signup`/`email` para confirmación y `recovery` para recuperación. Los retornos PKCE se intercambian cuando Supabase entrega un `code` y existe su verificador en el mismo dispositivo.

`detectSessionInUrl` está desactivado para que el SDK y el callback no consuman el mismo enlace. El callback valida el propósito, exige credenciales completas y verifica la sesión con Supabase. En web retira códigos y tokens del historial después de consumir el enlace, también si falla. Ningún mensaje de interfaz incluye los tokens ni el error remoto sin filtrar.

Los ajustes de SMTP, entrega real y allowlist deben comprobarse en el entorno que se publique. No se enviaron correos reales durante las pruebas.

## Reanudación y datos privados

`use-auth-session.ts` es la única suscripción global al SDK:

1. Recupera la sesión guardada y comprueba la identidad con `getUser`.
2. Una sesión rechazada se cierra localmente. Un fallo temporal muestra reintento y conserva las credenciales.
3. Un evento de acceso más reciente tiene prioridad sobre una lectura inicial que termine tarde.
4. Al cerrar sesión o cambiar de cuenta se vacía TanStack Query para retirar los datos privados de la cuenta anterior.
5. En nativo, la renovación automática se activa en primer plano y se detiene en segundo plano. La web conserva la gestión de visibilidad del SDK.

Los tokens nativos permanecen en SecureStore y no migran a otro dispositivo. El adaptador divide por bytes UTF-8, publica el manifiesto solo después de escribir todos los fragmentos y conserva la versión anterior si falla una escritura. Puede leer los fragmentos del formato anterior. El bloqueo de procesos del SDK serializa operaciones de sesión nativas.

La web sigue siendo un destino de desarrollo/vista previa. Si se publica como producto web, deberá revisarse la estrategia de sesión y protección frente a XSS; este cambio conserva el almacenamiento web existente.

## Recuperación interrumpida

El contexto de recuperación guarda únicamente la cuenta y si la contraseña ya se actualizó. Usa el mismo almacén seguro. Al reiniciar, la misma cuenta vuelve al formulario de recuperación, incluso si su onboarding ya terminó. Las rutas privadas permanecen cubiertas y redirigen a recuperación.

El cambio de contraseña y el cierre global son dos operaciones distintas. Si falla el cierre después de actualizar, la interfaz ofrece **Finalizar recuperación**. El reintento, también después de reiniciar, no vuelve a cambiar una contraseña que el servidor ya aceptó. Al terminar se retiran sesión, contexto y caché.

La pantalla exige sesión y modo de recuperación antes de mostrar campos. Abrir `new-password` directamente sin ellos ofrece solicitar un enlace válido. Estos controles organizan la interfaz: la autorización real corresponde a Supabase Auth y las políticas RLS.

## Onboarding corto

Se pueden elegir géneros y meta, saltar cada paso o pulsar **Dejar gustos y meta para después** para ir directamente al usuario. Las preferencias se guardan antes de avanzar; los pasos 1, 2 y 3 permiten reanudar el recorrido. Al posponer la meta se conserva el punto de partida existente, actualmente 12 libros, que puede cambiarse después en Ajustes.

El nombre se normaliza a minúsculas, permite de 3 a 30 letras ASCII, números y guion bajo, y se consulta tras una pausa de 350 ms. Si la consulta falla, **Volver a comprobar** reintenta sin borrar el campo. Un resultado de disponibilidad no reserva el nombre: la restricción única y `complete_onboarding` resuelven las carreras al guardar. Un conflicto invalida la disponibilidad anterior y permite elegir otro.

La migración `20261020135220_auth_username_availability.sql` mantiene la función pública como `SECURITY INVOKER`. La comprobación global de nombres se ejecuta en un ayudante de privilegios elevados dentro de `lexa_auth`, un esquema que debe permanecer fuera de los esquemas expuestos por PostgREST. Solo `authenticated` puede ejecutarlo y siempre exige `auth.uid()`. Solo devuelve un booleano; los bloqueos no liberan nombres ya reservados. La migración ya fue aplicada al proyecto Lexa y su versión coincide con la del archivo.

## Comprobaciones

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
