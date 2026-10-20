# Registro de lectura del MVP

## Entradas y componentes

Búsqueda (`QuickPeekSheet`), biblioteca, listas y feed (`BookDetailSheet`) abren `BookReadingSheet`. La ficha completa usa el mismo `ReadingRecordControls` en Resumen y abre la hoja desde sus acciones superiores. Los enlaces a libros del perfil, reseñas y similares desembocan en esa ficha. Los componentes comparten tipografía, colores semánticos, geometría, foco y áreas táctiles del design system, con textos en español e inglés.

`app/book/[id].tsx` solo exporta la pantalla de `src/features/book/screens`. La lógica de consultas y escrituras vive en `src/features/library`, separada de los componentes visuales.

El hook generado `useColors` consulta el tema activo de `useThemeStore`, igual que la raíz de la aplicación. Esto mantiene los iconos y los colores inline sincronizados con las clases del design system al cambiar de tema.

## Estados y puntuación

- **Pendiente:** no tiene fechas de inicio ni finalización.
- **Leyendo:** propone el día local de inicio. Si se vuelve desde Leído, empieza con la fecha de hoy y retira la finalización anterior.
- **Leído:** propone el día local de finalización al entrar al estado. Se puede corregir a una fecha anterior.
- **Abandonado:** conserva el inicio conocido y no cuenta como finalizado.

Tocar el estado activo no cambia ni elimina nada. Cambiar el estado conserva la puntuación y las etiquetas. Una puntuación va de 0,5 a 5 en pasos de 0,5: tocar una estrella selecciona la nota completa y repetir la pulsación selecciona media estrella. **Quitar puntuación** envía `null`; nunca elimina el libro ni sus fechas. Puntuar un libro todavía no guardado lo crea como Pendiente, sin dar por terminada una lectura.

## Fechas y meta anual

La fecha de inicio es opcional; al finalizar se registra una fecha de fin. **Fechas de lectura** permite corregirlas juntas, usar Hoy o retirar el inicio. Se rechazan días inexistentes, fechas futuras e intervalos invertidos. El cliente utiliza fechas `AAAA-MM-DD` del dispositivo, sin convertirlas a UTC. El servidor acepta como día local únicamente hoy o un día adyacente al calendario UTC para cubrir husos horarios.

La meta cuenta filas con estado `read` y `finished_at` dentro del año consultado. Editar una puntuación no mueve el libro a otro año. La clave de caché incluye el año y, al cambiar de calendario, el objetivo de un año anterior no se presenta como objetivo ya configurado para el nuevo: se usa el valor inicial de 12 hasta editarlo.

Las lecturas antiguas sin finalización mantienen la fecha desconocida. No se hace un backfill con la fecha de edición: la interfaz solicita añadir una fecha antes de incluirlas en una meta. El MVP conserva un registro por usuario y libro; no añade un historial de relecturas.

## Escritura y seguridad

`save_reading_record(book_id, changes, today)` es una RPC `SECURITY INVOKER`, con `search_path` vacío y ejecución solo para `authenticated`. Obtiene el propietario desde `auth.uid()` y conserva las políticas RLS existentes. No acepta un propietario ni columnas arbitrarias en el JSON.

El bloqueo transaccional por usuario y libro cubre también la primera inserción. Cada propiedad omitida conserva su valor; `null` elimina explícitamente el dato. La RPC vuelve a validar las fechas y las restricciones SQL protegen el orden, la correspondencia entre estado y fechas y la escala de puntuación. Los contadores siguen dependiendo de los triggers existentes, sin incrementos manuales desde el cliente.

La migración `20261020154206_reading_tracking_mvp.sql` está aplicada al proyecto Lexa. `src/types/database.ts` se regeneró desde ese proyecto.

## Caché y errores

La escritura optimista distingue entre ausencia y `null`. Se cancelan consultas previas, se conserva una instantánea y se restaura si falla la escritura. Al responder, la fila del servidor sustituye la proyección. Los controles del mismo libro comparten una identidad de mutación y las escrituras se serializan.

Después se invalidan biblioteca, contadores, meta anual, perfil, lecturas recientes, comunidad del libro, feed y puntuaciones asociadas a reseñas. Si no se pudo cargar la lectura, se ofrece Reintentar antes de permitir cambios. Los errores de guardado mantienen los datos anteriores y se comunican junto al formulario.

## Verificación

- `pnpm typecheck`, ESLint sobre los archivos modificados, Prettier y `pnpm check:theme`.
- `src/__tests__/features/library/reading-record.test.ts`: transiciones, fechas reales, años, retirada explícita y lecturas antiguas.
- `supabase/tests/reading-record.sql`: pruebas reales de RPC, RLS entre cuentas, restricciones, contadores y cambios de año. Se ejecuta en una transacción con rollback y cuentas sintéticas.
- `scripts/check-reading-preview.cjs`: navegador aislado con el cliente real y respuestas HTTP simuladas. Recorre ficha, búsqueda, biblioteca, feed y listas, incluidos errores de escritura. Las capturas se guardan en `.expo/reading-preview`.

```powershell
pnpm exec expo start --web --port 8082
$env:LEXA_BROWSER_MODULES = 'ruta/absoluta/a/node_modules/con/playwright'
node scripts/check-reading-preview.cjs
```

`LEXA_READING_PREVIEW_URL` permite cambiar el origen. La revisión web no sustituye la comprobación de teclado y áreas seguras en una compilación instalada de Android/iOS.
