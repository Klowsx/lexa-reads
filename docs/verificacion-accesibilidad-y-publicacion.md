# Accesibilidad y preparación de publicación

Estado al 21 de octubre de 2026: **en progreso**. Esta nota registra lo comprobado
para el último punto del MVP; no sustituye un recorrido en Android instalado.

Comprobaciones de código: TypeScript, ESLint de archivos cambiados, Prettier,
compatibilidad de dependencias Expo y exportación web completados; 12 pruebas
existentes de enlaces de acceso pasan. `pnpm check:theme` sigue fallando por una
diferencia previa de formato entre `colors.ts` y la salida de su generador, sin
cambios de valores; se dejó ese archivo ajeno al pedido intacto.

## Implementado en esta pasada

- Los errores de mutaciones se muestran en la app mediante avisos globales que
  permanecen hasta cerrarlos. El guardado de meta, privacidad y consentimiento
  también muestra un error junto al control afectado.
- Los interruptores de Ajustes y consentimiento anuncian nombre, estado y
  disponibilidad; sus áreas táctiles miden 48 × 48 puntos. El consentimiento
  puede desplazarse si aumenta el tamaño del texto o el dispositivo es pequeño.
- Los controles de meta, tema y navegación de Ajustes disponen de objetivos
  táctiles de al menos 48 puntos y etiquetas o estados accesibles.
- Las acciones modificadas usan el color de texto oscuro del design system
  sobre el acento (contraste calculado 5,25:1 en estado activo). Los errores
  globales muestran una instrucción legible en vez del mensaje técnico del servidor.
- En Registro, los enlaces legales son controles independientes de la casilla de
  aceptación: abrir un documento no acepta los términos.
- Los datos públicos todavía desconocidos están en
  [`public/legal/release-info.json`](../public/legal/release-info.json), con valores
  `null`. `pnpm legal:render` se detiene si falta cualquiera de ellos. La política
  de privacidad y los otros documentos siguen siendo borradores para revisión.

## Trabajo de cierre y evidencia esperada

El estado de estos trabajos se registra en [Pendientes](pendientes.md).

Definir la identidad legal, los correos operativos, la jurisdicción, la edad
mínima y la fecha de vigencia; revisar legal y técnicamente los borradores.
Generar el inventario de licencias de dependencias.

Publicar documentos aprobados en `lexareads.app` y abrir **todos** los enlaces
desde Registro y Ajustes en una instalación real. Todavía no hay hosting
configurado para esos documentos.

Generar una APK de prueba. La cuenta EAS activa (`javierhr1`) no puede leer el
proyecto configurado, propiedad de `javierhr`. La compilación local también
se detuvo antes de compilar por `Unable to establish loopback connection` de
Gradle 8.14.3 (probado con JDK 17 y 21). Hay que usar una sesión con acceso a
ese proyecto o reparar el entorno de Gradle.

Instalar esa APK en el Android y recorrer Registro, biblioteca, detalle de
libro, Ajustes y consentimiento con TalkBack, texto ampliado y pantalla
pequeña. Forzar un error de red y comprobar anuncio, recuperación y foco.
El Android 13 ya aparece en `adb devices`; falta la APK para instalarla. Se
intentó abrir el proyecto en Expo Go, pero la versión instalada es para SDK
57 y este proyecto usa SDK 54, por lo que tampoco permitió el recorrido.

El punto del plan debe permanecer sin marcar hasta tener enlaces públicos y la
instalación y el recorrido nativo documentados.
