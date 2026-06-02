Pantallas que faltan ❌

Críticas (dead ends — hay tap pero sin destino)

┌───────────────────────┬──────────────────────────────────────────────────────────────┬──────────────────────────┐
│ Pantalla │ Por qué falta │ Dónde se toca │
├───────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────┤
│ app/list/[slug].tsx │ Explícito en target de CLAUDE.md. ProfileLists tiene chevron │ Lists en perfil propio y │
│ │ pero sin onPress. │ ajeno │
├───────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────┤
│ app/comments/[id].tsx │ FeedCard muestra el contador de comentarios pero el botón no │ Botón comentario en el │
│ │ navega a ningún lado │ feed │
└───────────────────────┴──────────────────────────────────────────────────────────────┴──────────────────────────┘

Importantes (producto incompleto sin ellas)

┌────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│ Pantalla │ Por qué falta │
├────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│ Vista completa de │ BookReviewsTab trunca las reseñas a 6 líneas (numberOfLines={6}) pero no hay forma de leer │
│ reseña │ el texto completo │
├────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│ Crear / editar │ ProfileLists tiene + Nueva pero en profile.tsx no se pasa onNewList. Sin esta pantalla no │
│ lista │ se puede crear ni modificar listas │
└────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────┘

Nice-to-have

├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Mis reseñas │ El perfil muestra libros recientes pero no hay un acceso directo al listado de tus propias │
│ │ reseñas │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘

---

Prioridad sugerida: Lista → Comentarios → Vista de reseña → Crear lista. ¿Quieres que implemente alguna o todas?
