---
name: Lexa
description: Biblioteca personal y comunidad de lectura con una calma editorial.
colors:
  accent: '#000000'
  on-accent: '#ffffff'
  light-bg: '#fff8f5'
  light-surface: '#ffffff'
  light-raised: '#f6ece6'
  light-text: '#1f1b17'
  dark-bg: '#121316'
  dark-surface: '#1a1c22'
  dark-raised: '#23252e'
  dark-text: '#f8fafc'
typography:
  display:
    fontFamily: 'Newsreader, Georgia, serif'
    fontSize: '28px'
    fontWeight: 600
    lineHeight: '36px'
  body:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: '24px'
  label:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 600
    lineHeight: '20px'
rounded:
  cover: '6px'
  card: '12px'
  sheet: '24px'
spacing:
  container: '16px'
---

# Design System: Lexa

## Sistema de Stitch

El sistema de Stitch es la base compartida de las pantallas nuevas y existentes. La primera entrega fue gradual; la ampliación posterior fue autorizada expresamente por el usuario. La implementación y sus límites están en [la adopción de Stitch](docs/stitch-adoption.md).

La fuente ejecutable es `src/theme/tokens.json`. Cambiar allí la paleta y regenerar con `pnpm gen:theme`; nunca editar `colors.ts` ni `generated-colors.css` a mano. `useColors` y `useStitchTheme` consumen la misma paleta. Tailwind y `src/theme/typography.ts` comparten Newsreader e Inter.

## Identidad y composición

Lexa mantiene una calma editorial: las portadas y las voces de los lectores llevan el contenido. Newsreader presenta libros y títulos; Inter permite leer, escribir y actuar. Evitar decoraciones, tarjetas anidadas, sombras amplias, neón y datos de muestra que aparenten funcionalidad.

La profundidad se construye con `bg`, `surface`, `sr` y `sh`. Usar bordes cuando sea necesario separar contenido; reservar las sombras perceptibles para las portadas. El margen horizontal de pantalla es 16 px; los bloques pueden aumentar el espacio cuando su jerarquía lo requiera.

## Color y contraste

La acción principal usa `accent` con `onAccent`: negro sobre el tema claro y tinta clara sobre el oscuro. Nunca fijar blanco como contenido de un botón primario. `text`, `t2` y `t3` distinguen contenido principal, secundario y auxiliar, manteniendo contraste AA sobre las superficies.

Los estados usan `error`, `success`, `warning`, `star` y `status`. Consumirlos desde `useColors` si dependen del tema; `fixed` se reserva para colores deliberadamente estables como las portadas y avatares. Los estados de lectura siempre incluyen texto o icono con significado accesible.

## Tipografía

- Títulos: Newsreader 400, 600 o 700; cursiva 400 para referencias editoriales.
- Contenido y campos: Inter 400, 16 px y altura de línea de 24 px.
- Etiquetas: Inter 500 o 600, normalmente 14 px y altura de línea de 20 px.
- Metadatos breves: 12 px cuando no sustituyen una acción o contenido principal.
- Respetar el escalado de texto del sistema y evitar alturas fijas que recorten etiquetas.

## Componentes y navegación

Reutilizar los controles existentes y los componentes `StitchButton`, `StitchSheet`, `StitchFeedback` y `StitchLoading` según su responsabilidad. Las hojas mantienen confirmación explícita y errores recuperables. Los formularios conservan el borrador cuando falla el guardado.

`AppHeader` comparte identidad, Comunidad y notificaciones entre Inicio, Buscar y Biblioteca. `AppTabBar` conserva cinco destinos reales: Inicio, Buscar, Biblioteca, Notificaciones y Perfil. Mantener los eventos de React Navigation, etiquetas accesibles y estado seleccionado.

Los objetivos táctiles principales tienen al menos 48 px. Los iconos interactivos requieren etiquetas; el foco web debe ser visible. El contenido de una reseña marcada como spoiler no aparece en una tarjeta exportada, aunque el lector lo haya revelado dentro de la app.

## Datos y accesibilidad

Una referencia visual no introduce contratos de producto nuevos: no añadir planes de pago, formato enriquecido, guardado automático, llamadas o indicadores de escritura sin soporte real. Las portadas, contadores y nombres vienen del catálogo y de la cuenta; usar alternativas explícitas si faltan.

Distinguir carga, error y vacío; conservar los fallos parciales aunque haya datos previos. Las animaciones respetan reducir movimiento. Verificar contraste en ambos temas, teclado en web, contenido ampliado y lectores de pantalla. Las comprobaciones automatizadas no sustituyen la prueba física pendiente de publicación.
