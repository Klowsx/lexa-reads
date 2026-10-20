---
name: Lexa
description: Biblioteca personal y comunidad de lectura con una calma editorial.
colors:
  accent: '#C4783A'
  star: '#E8C05A'
  light-bg: '#F5F0EA'
  light-surface: '#EBE5DE'
  light-raised: '#E0D9D1'
  light-text: '#1A1512'
  dark-bg: '#100D0A'
  dark-surface: '#1C1815'
  dark-raised: '#252118'
  dark-text: '#F0EAE2'
  border-light: '#C2BAB0'
  border-dark: '#35302B'
  muted-light: '#685E55'
  muted-dark: '#9E9488'
  success: '#5CAF7E'
  error: '#C43A3A'
  warning: '#C49A20'
  status-reading: '#4A96B8'
  status-want: '#8A6CD8'
  status-abandoned: '#787068'
typography:
  display:
    fontFamily: 'Playfair Display, Georgia, serif'
    fontSize: '30px'
    fontWeight: 600
    lineHeight: '38px'
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'Playfair Display, Georgia, serif'
    fontSize: '26px'
    fontWeight: 600
    lineHeight: '32px'
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'DM Sans, system-ui, sans-serif'
    fontSize: '20px'
    fontWeight: 400
    lineHeight: '28px'
  label:
    fontFamily: 'DM Sans, system-ui, sans-serif'
    fontSize: '16px'
    fontWeight: 600
    lineHeight: '20px'
rounded:
  cover: '5px'
  sm: '6px'
  md: '12px'
  card: '14px'
  lg: '20px'
  xl: '28px'
  full: '999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  container: '18px'
  lg: '20px'
  xl: '24px'
  xxl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '#FFFFFF'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '15px 24px'
  chip-selected:
    backgroundColor: '{colors.light-raised}'
    textColor: '{colors.accent}'
    rounded: '{rounded.full}'
    padding: '6px 14px'
  tab-navigation:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.muted-light}'
    height: '56px'
---

# Design System: Lexa

## Overview

**Creative North Star: "La biblioteca habitada"**

Lexa combina la pausa de una biblioteca personal con la conversación de una comunidad lectora. La interfaz debe sentirse cálida, tranquila y estética, pero ante todo útil: encontrar un libro, registrar una lectura, compartir una reseña o seguir a otra persona debe requerir muy poca atención visual.

La calidez viene de los neutros tierra, de la tipografía editorial y de las portadas, no de adornos. El producto alterna superficies tonales en lugar de tarjetas flotantes. El modo oscuro debe sentirse como una sala de lectura nocturna, no como una interfaz negra de alto contraste.

**Key Characteristics:**

- Editorial en títulos y nombres de libros; sobrio y eficiente en controles y datos.
- Color de acento escaso y significativo; las portadas aportan la mayor riqueza cromática.
- Jerarquía por tipografía, espacio y superficie, no por sombras decorativas.
- Densidad cómoda para explorar, con acciones táctiles claras y estados visibles.
- Accesibilidad WCAG AA como mínimo en ambos temas y con movimiento reducido.

## Colors

La paleta es una escala de papel, madera y tinta. Se mantiene estable entre temas, cambiando la luminosidad de sus superficies, mientras el terracota conserva su papel de acción principal.

### Primary

- **Terracota de lectura**: se usa para la acción primaria, selección actual, vínculos de énfasis y confirmaciones de interacción. Nunca debe ocupar grandes áreas de una pantalla.
- **Oro de valoración**: reservado exclusivamente para estrellas y puntuaciones, nunca para botones principales.

### Secondary

- **Azul de lectura**: comunica el estado “leyendo”.
- **Violeta de intención**: comunica “quiero leer”.
- **Verde de cierre**: comunica lecturas terminadas y confirmaciones exitosas.

### Neutral

- **Papel claro** y **superficie clara** forman el fondo y los contenedores del tema claro.
- **Tinta clara** y **tinta oscura** sostienen el texto principal en sus temas correspondientes.
- **Papel nocturno** y **superficie nocturna** crean profundidad en el tema oscuro sin usar negro puro.
- Los tonos mudos se reservan para metadatos, fechas, autorías y texto auxiliar, siempre con contraste AA sobre su superficie.

**The Quiet Accent Rule.** El terracota solo identifica la acción principal, la selección o una relación activa. Si más del 10% de la pantalla es terracota, se ha usado como decoración y debe retirarse.

**The Status Has Words Rule.** Los colores de estado nunca funcionan solos. Todo estado de lectura se acompaña de etiqueta, icono o texto que mantenga su significado para personas con visión cromática diversa.

## Typography

**Display Font:** Playfair Display (Georgia, serif)
**Body Font:** DM Sans (system-ui, sans-serif)

**Character:** Playfair Display aporta el ritmo de una cubierta o una página impresa. DM Sans mantiene la interfaz directa y legible. La serif nunca se usa en botones, campos, navegación ni datos densos.

### Hierarchy

- **Display**: Playfair Display semibold, para títulos de pantalla, nombres de libros destacados y encabezados de bloques editoriales.
- **Headline**: Playfair Display semibold, para títulos de secciones y tarjetas con protagonismo.
- **Body**: DM Sans regular, para descripciones, reseñas, campos y contenido funcional. El mínimo funcional es 16 px; las etiquetas críticas no deben reducirse por debajo de ese tamaño.
- **Label**: DM Sans semibold, para botones, pestañas, chips y acciones. Las mayúsculas se permiten solo en rótulos muy cortos, nunca en párrafos ni acciones extensas.
- **Book title**: puede usar Playfair Display en cursiva cuando se cite dentro de una actividad o reseña; debe conservar contraste y truncarse con cuidado.

**The Editorial Boundary Rule.** La tipografía editorial narra y presenta libros. La tipografía sans permite actuar. No se intercambian esos papeles.

## Elevation

Lexa usa elevación tonal por defecto: fondo, superficie y superficie elevada separan contenido mediante sus valores de color y bordes discretos. Las portadas pueden usar una sombra compacta para parecer objetos físicos; los botones, hojas y tarjetas comunes no deben combinar borde visible con una sombra amplia.

**The Cover Exception Rule.** Solo una portada o un elemento que represente físicamente un libro puede proyectar una sombra perceptible. Para los demás elementos, usar superficie o borde, nunca ambos para decorar.

## Components

### Buttons

- **Shape:** esquinas suavemente redondeadas de 12 px; las acciones rápidas y chips pueden ser píldoras completas.
- **Primary:** terracota con texto blanco, DM Sans semibold y un área táctil vertical de al menos 48 px. La etiqueta describe la acción, por ejemplo, “Guardar reseña”.
- **Disabled / Loading:** conserva el color de acción con opacidad reducida o indicador de progreso. Nunca debe aparentar que una acción se guardó antes de confirmarse.
- **Secondary / Ghost:** texto en color principal o tinta, sin relleno decorativo. Útil cuando acompaña una única acción primaria.
- **Focus:** anillo visible de 2 px que no dependa solo del cambio de color; en web debe ser navegable por teclado.

### Chips and Statuses

- **Style:** píldoras de 999 px, con relleno tonal ligero y borde fino en reposo.
- **Selected:** usa el color semántico del estado, texto legible y `accessibilityState.selected`.
- **Meaning:** “Leyendo”, “Leído”, “Quiero leer” y “Abandonado” siempre se muestran como texto, no como una mera mancha de color.

### Cards and Content Containers

- **Corner Style:** 14 px para tarjetas funcionales; 5 px para portadas, respetando la geometría editorial de un libro.
- **Background:** `surface` para contenido agrupado y `sr` para bloques secundarios. Evitar tarjetas dentro de tarjetas.
- **Border:** un borde tenue de 1 px solo cuando se necesita separar contenido del mismo tono.
- **Internal Padding:** 12 a 20 px según densidad, con 18 px como margen horizontal base de pantalla.

### Inputs and Fields

- **Style:** superficie tonal, borde discreto y DM Sans. El texto introducido usa tinta principal, el placeholder usa tono mudo con contraste AA.
- **Focus:** borde o anillo de 2 px en terracota sin cambiar el tamaño del control.
- **Error:** rojo semántico, mensaje explicado en texto y asociación accesible con el campo. No usar solo el borde rojo.

### Navigation

- **Tab bar:** superficie tonal con borde superior discreto. El destino activo usa terracota, icono y etiqueta; los destinos inactivos usan tono mudo.
- **Headers:** título editorial a la izquierda y acciones con iconos reconocibles a la derecha. Cada icono interactivo requiere etiqueta accesible y área táctil mínima de 44 × 44 px.

### Book Covers

- **Role:** son el principal elemento visual y la fuente permitida de variedad cromática del producto.
- **Fallback:** cuando falta imagen, utilizar una cubierta tipográfica oscura con una paleta derivada del libro, título truncado y contraste alto.
- **Treatment:** radios de 5 px y sombra física compacta solo si la portada está aislada sobre una superficie plana.

## Do's and Don'ts

### Do:

- **Do** usar Playfair Display para títulos que aporten contexto editorial y DM Sans para toda interacción.
- **Do** usar el terracota para una acción primaria o una selección por área, no como relleno decorativo repetido.
- **Do** mantener los tres niveles tonales de cada tema antes de añadir bordes o sombras.
- **Do** mostrar estados de carga, error, vacío, éxito y deshabilitado de forma explícita.
- **Do** respetar contraste WCAG AA, tamaños táctiles mínimos de 44 × 44 px y la preferencia de movimiento reducido.
- **Do** dejar que las portadas y las citas de reseñas den personalidad a la pantalla.

### Don't:

- **Don't** copiar la paleta roja, la navegación web, carruseles decorativos o el sistema de radios de Pinterest.
- **Don't** usar gradientes, glassmorphism, neón, sombras extensas ni tarjetas flotantes como decoración.
- **Don't** usar Playfair Display en botones, formularios, navegación, filtros o información densa.
- **Don't** comunicar un estado solo con color, ni usar tonos mudos que no cumplan contraste sobre la superficie.
- **Don't** redondear todas las superficies como píldoras. Las píldoras son para filtros, etiquetas y acciones rápidas.
- **Don't** introducir animaciones de entrada coreografiadas. El movimiento debe explicar una transición, una carga o una confirmación y respetar la reducción de movimiento.
