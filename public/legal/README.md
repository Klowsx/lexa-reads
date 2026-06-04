# Documentos legales — publicación

Fuente de los documentos legales de Lexa. **Deben publicarse en el dominio** para
que los enlaces de la app (registro + Ajustes → Legal) funcionen.

## Mapa URL → archivo

| URL (en `app/`)                  | Archivo                       | Estado |
|----------------------------------|-------------------------------|--------|
| `https://lexareads.app/terms`    | `terms.md`                    | plantilla |
| `https://lexareads.app/eula`     | `eula.md`                     | plantilla |
| `https://lexareads.app/community`| `community-guidelines.md`     | plantilla |
| `https://lexareads.app/privacy`  | *(documento de privacidad)*   | pendiente — no está en el repo |
| `https://lexareads.app/licenses` | *(licencias OSS)*             | pendiente |

## Antes del submit (bloqueante de tiendas)

1. **Revisar con asesoría legal** y rellenar los `<...>` (entidad, contacto,
   jurisdicción, edad mínima, fecha).
2. Publicar cada documento en su URL (renderizar el Markdown a HTML o servirlo).
   Apple §1.2 (UGC) exige que **Términos/EULA + Normas con tolerancia cero** sean
   accesibles y que exista reportar + bloquear + respuesta ≤24h (ya implementado).
3. Verificar que los enlaces abren desde **Registro** y **Ajustes → Legal**.
4. (Recomendado) versión en inglés si se publica en mercados de habla inglesa.

> Las URLs viven como constantes en `app/settings.tsx` y `app/(auth)/register.tsx`.
> Si cambias los paths, actualízalas ahí.
