# Runbook de moderación — Lexa Reads

> Proceso para cumplir el SLA de **≤24h** en reportes de contenido que exigen
> App Store y Play Store. Resuelve el hallazgo C-4 de `auditoria.md`.

## Quién modera

Cualquier usuario con `users.is_admin = true`. Para promover a alguien (desde el
SQL Editor de Supabase, que corre como `service_role` y bypasa RLS):

```sql
UPDATE users SET is_admin = true WHERE username = '<tu_usuario>';
```

Mantén el número de admins al mínimo. `is_admin` también habilita la moderación
del catálogo `books` (migración 012).

## SLA

- **Triage de cada reporte: ≤24h** desde su creación (`reports.created_at`).
- Revisa la cola **al menos una vez al día**. Si esperas volumen, configura una
  alerta (ver más abajo).

## Cola de reportes

Los usuarios crean reportes desde la app (`ReportSheet` → `useCreateReport` →
`submit_report`) sobre `review | comment | user | list | activity | message |
club`. La RPC valida el objetivo y el motivo, limita abuso y evita duplicados
activos antes de crear una fila con `status = 'pending'`.

### Opción A — Supabase Studio (mínimo viable, hoy)

1. Studio → Table Editor → `reports`, filtrar `status = pending`, ordenar por
   `created_at` ascendente (los más viejos primero).
2. Para cada fila, inspeccionar el contenido objetivo:
   - `target_type = review` → tabla `reviews`, `id = target_id`
   - `target_type = comment` → tabla `comments`
   - `target_type = user` → tabla `users`
   - `target_type = list` → tabla `lists`
   - `target_type = activity` → tabla `activity_feed`
   - `target_type = message` → tabla `messages`
   - `target_type = club` → tabla `reading_clubs`
3. Decidir y actuar (ver abajo).
4. Cerrar el reporte:
   ```sql
   UPDATE reports
   SET status = 'resolved',   -- o 'dismissed' si no procede
       resolved_at = now()
   WHERE id = '<report_id>';
   ```

### Opción B — pantalla admin in-app (futuro)

Las policies de la migración 015 ya permiten que un cliente autenticado con
`is_admin` haga `SELECT`/`UPDATE` sobre `reports`. Una pantalla admin puede
construirse encima sin cambios de RLS.

## Acciones de moderación

Según la gravedad:

- **Contenido infractor** → soft-delete:
  - reseña: `UPDATE reviews SET deleted_at = now() WHERE id = '<id>';`
  - comentario: `UPDATE comments SET deleted_at = now() WHERE id = '<id>';`
- **Catálogo contaminado** (libro basura/ofensivo) → `DELETE FROM books WHERE id = '<id>';`
  (requiere `is_admin`; policy de la migración 012).
- **Usuario reincidente / abusivo** → según política: anonimizar, suspender
  (p. ej. forzar `is_private`) o, en casos graves, iniciar borrado de cuenta.
- **Sin infracción** → `status = 'dismissed'`.

Siempre setea `resolved_at` al cerrar — es la evidencia del cumplimiento del SLA.

## Métrica de cumplimiento

Reportes que tardaron más de 24h en resolverse (deberían ser 0):

```sql
SELECT id, target_type, reason, created_at, resolved_at,
       resolved_at - created_at AS tiempo_resolucion
FROM reports
WHERE resolved_at IS NOT NULL
  AND resolved_at - created_at > interval '24 hours'
ORDER BY created_at DESC;
```

Cola pendiente actual:

```sql
SELECT count(*) FILTER (WHERE status = 'pending')   AS pendientes,
       count(*) FILTER (WHERE status = 'reviewing') AS en_revision,
       min(created_at) FILTER (WHERE status = 'pending') AS mas_antiguo
FROM reports;
```

## Pendiente recomendado

- Alerta automática (cron/Edge Function) que avise si hay un `pending` con
`created_at` de hace más de, p. ej., 12h — margen para no incumplir el SLA.
</content>
