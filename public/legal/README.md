# Documentos legales — publicación

Fuente de los documentos legales de Lexa. **Deben publicarse en el dominio** para
que los enlaces de la app (registro + Ajustes → Legal) funcionen.

## Mapa URL → archivo

| URL (en `app/`)                   | Archivo                   | Estado                      |
| --------------------------------- | ------------------------- | --------------------------- |
| `https://lexareads.app/terms`     | `terms.md`                | plantilla                   |
| `https://lexareads.app/eula`      | `eula.md`                 | plantilla                   |
| `https://lexareads.app/community` | `community-guidelines.md` | plantilla                   |
| `https://lexareads.app/privacy`   | `privacy.md`              | borrador, requiere revisión |
| `https://lexareads.app/licenses`  | _(licencias OSS)_         | pendiente                   |

## Proceso de publicación

El estado de estas actividades se controla en
[Pendientes](../../docs/pendientes.md). Esta guía conserva el procedimiento y
las restricciones para ejecutarlas.

1. **Revisar con asesoría legal** los borradores y completar únicamente
   `release-info.json` con datos reales (responsable, correos, jurisdicción,
   edad mínima y fecha). Los valores `null` son deliberados: no hay datos
   públicos confirmados y no deben sustituirse por identidades o correos ficticios.
2. Ejecutar `pnpm legal:render`: detiene la preparación si falta algún dato y
   produce Markdown en `dist/legal/`. El resultado sigue siendo un borrador hasta
   la revisión legal y técnica; retirar las notas de plantilla al aprobarlo.
3. Publicar cada documento aprobado en su URL (renderizar el Markdown a HTML o servirlo).
   Apple §1.2 (UGC) exige que **Términos/EULA + Normas con tolerancia cero** sean
   accesibles y que exista reportar + bloquear + respuesta ≤24h (ya implementado).
4. Generar y revisar el inventario de licencias OSS y publicarlo en `/licenses`.
   Los avisos completos de Newsreader, Inter y sus paquetes Expo ya están en
   [licencias de fuentes](font-licenses.md). Incorporarlos al inventario general;
   este archivo por sí solo no enumera todas las dependencias de la aplicación.
5. Verificar que los enlaces abren desde **Registro** y **Ajustes → Legal**.
6. (Recomendado) versión en inglés si se publica en mercados de habla inglesa.

> Las URLs viven como constantes en `app/settings.tsx` y `app/(auth)/register.tsx`.
> Si cambias los paths, actualízalas ahí.
