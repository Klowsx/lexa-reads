# Biblioteca personal

La biblioteca consulta el estado seleccionado y combina búsqueda por título o autor, puntuación (todos, con o sin puntuación) y etiquetas existentes. La búsqueda espera 350 ms y trata el texto como literal: `%` no se convierte en un comodín. Las etiquetas se obtienen de toda la estantería, incluyendo libros aún no descargados.

## Datos y paginación

- `search_library` aplica los filtros en PostgreSQL y devuelve hasta 25 registros. El cliente muestra 24 y usa el adicional para detectar si hay otra página.
- El orden visible es «Añadidos más recientes primero». El cursor `(created_at, id)` resuelve empates y permanece estable al editar puntuación o estado. Las fechas nulas anteriores al cambio se ordenan como época Unix.
- `library_summary` agrupa totales y etiquetas en el servidor. Los totales no dependen del límite de filas de REST ni de la cantidad de páginas cargadas.
- Ambas funciones son `SECURITY INVOKER`, fijan `search_path` vacío, aplican `auth.uid()` y conservan RLS. Solo `authenticated` puede ejecutarlas; no aceptan un identificador de cuenta del cliente.
- Las páginas tienen claves distintas de las consultas simples del perfil. Todas conservan el prefijo de biblioteca para que guardar, editar o quitar una lectura invalide también páginas, totales y etiquetas.

La pantalla vive en `src/features/library/screens/` porque `CLAUDE.md` exige que `app/` contenga solamente rutas. No se añaden intermediarios de componentes: las portadas abren directamente `BookReadingSheet`.

## Experiencia y estados

La cuadrícula adapta las columnas al ancho disponible. Las pestañas y filtros se desplazan horizontalmente para conservar las etiquetas y los objetivos táctiles. Tipografía, colores, superficies, radios, portadas y puntuación usan el design system existente, con temas claro y oscuro.

Cada estado sin libros explica cómo alimentarlo. Una combinación sin coincidencias permite limpiar los filtros sin cambiar de estantería. Los errores iniciales ofrecen reintento; un fallo de página adicional conserva los libros cargados y muestra un reintento explícito. Hay carga incremental al acercarse al final, una acción manual para cargar más y actualización por arrastre.

Las etiquetas permiten filtrar datos existentes; su creación y edición no forman parte de este punto del MVP.

## Verificación

- `supabase/tests/library-pagination.sql`: ejecutado contra Supabase con cuentas sintéticas y `ROLLBACK`. Comprueba 55 libros con la misma fecha distribuidos en tres páginas sin duplicados ni omisiones, búsqueda por autor, texto literal, puntuación, etiquetas fuera de la primera página, estados, vacíos, totales y permisos entre cuentas y anónimos.
- `scripts/check-library-preview.cjs`: cliente real en navegador con HTTP simulado. Comprueba filtros combinados, búsqueda fuera de la primera página, paginación, error y reintento sin perder los libros cargados, errores iniciales, vacíos y anchos de 320, 390 y 1280 px en claro/oscuro.
- `scripts/check-reading-preview.cjs`: conserva la comprobación de edición desde biblioteca y las demás entradas.
- TypeScript, ESLint, Prettier y tokens de tema correctos; 48 pruebas unitarias y de componentes aprobadas. Cuatro suites de integración preexistentes no arrancan sin las credenciales de `.env.test` (auth/RLS, clubs, chat y Google Books). La seguridad específica de este cambio sí se comprueba con el SQL real anterior.

Pendiente de lanzamiento: recorrido en Android/iOS instalado, teclado, escalado de fuente y arrastre nativo. Las pruebas de navegador no sustituyen esa verificación.
