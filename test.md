CRÍTICO — bloquea el desarrollo

1. ✅ global.css — error de TS resuelto (declare module '\*.css' en nativewind-env.d.ts)

2. ⏳ src/types/database.ts es un placeholder (pendiente — esperar a migración 003)
   El archivo tiene export type Database = any; — las queries de Supabase no tienen tipos. Hay que regenerar con:
   supabase gen types typescript --project-id <id> > src/types/database.ts

3. ✅ comments — migración 003_comments.sql creada (ENUM + tabla + trigger comments_count + RLS)

4. ✅ notification_preferences — migración 004 creada (tabla + trigger updated_at + RLS + fix handle_new_user)

5. content_reports (002) choca con reports (STACK.md)
   Son la misma idea pero estructuras distintas:

┌────────────────┬────────────────────────┬──────────────────────────────────────────────────────────────────────┐
│ Campo │ 002 content_reports │ STACK.md reports │
├────────────────┼────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ tipo de │ content_type │ target_type report_target_type ENUM │
│ destino │ varchar(50) │ │
├────────────────┼────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ razón │ reason varchar(100) │ reason varchar(50) │
├────────────────┼────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ detalle │ — │ details text │
├────────────────┼────────────────────────┼──────────────────────────────────────────────────────────────────────┤
│ estado │ solo resolved_at │ status report_status ENUM │
│ │ │ ('pending','reviewing','resolved','dismissed') │
└────────────────┴────────────────────────┴──────────────────────────────────────────────────────────────────────┘

La de STACK.md es mejor (tiene tracking de estado). La de 002 quedará obsoleta.

6. ✅ Fuentes — @expo-google-fonts instaladas y cargadas con useFonts en \_layout.tsx

---

IMPORTANTE — inconsistencias que generan bugs

7. ✅ \_layout.tsx — router.replace corregido a /(tabs)/feed

8. ✅ Campos faltantes — migración 006_schema_sync.sql (reading_goal_year, accepted_at, CHECK anti-autofollow, published_year, language char(2), tags en user_books, edited_at en reviews)

9. ✅ RLS users — policy actualizada para excluir usuarios que te bloquearon
10. ✅ RLS user_books — FOR ALL reemplazado por 4 policies explícitas (SELECT + INSERT + UPDATE + DELETE)
    - reviews y activity_feed también actualizados para respetar user_blocks

---

MENOR — deuda técnica

12. src/lib/google-books.ts no existe — regla arquitectónica explícita: pantallas nunca llaman la API directo. Sin
    este archivo el primer feature de búsqueda va a violar la arquitectura.

13. No hay setup de Jest — package.json no tiene dependencias de test ni config.

---

Orden de arreglo sugerido

1. Instalar fuentes (@expo-google-fonts) — 5 min
2. Importar global.css en \_layout.tsx — 1 línea
3. Fix router.replace a /(tabs)/feed — 1 línea
4. Migración 003: comments + notification_prefs — nueva migración
   - campos faltantes en users/follows/books/etc
   - DROP content_reports, CREATE reports correcto
   - Fix RLS users (user_blocks)
   - Fix RLS user_books (separar ALL en writes)
5. Regenerar src/types/database.ts — comando CLI
6. Crear src/types/index.ts — tipos de dominio
7. Crear src/lib/google-books.ts — regla arquitectónica

¿Quieres que empiece por el punto 4 (migración 003 que sincroniza el esquema con STACK.md) o prefieres otro orden?
