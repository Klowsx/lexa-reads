# Instrucciones para trabajar en este repositorio

Seguir la arquitectura documentada en `CLAUDE.md`, el producto de `PRODUCT.md` y el design system existente. Estas reglas aplican también a correcciones y refactors.

## Simplicidad y separación de archivos

- Resolver el problema con el menor cambio que mantenga claridad y corrección. No añadir abstracciones para necesidades futuras hipotéticas.
- Antes de crear o separar un archivo, identificar su responsabilidad concreta: reutilización real entre consumidores, reglas de negocio comprobables por separado o una frontera arquitectónica exigida por el repositorio.
- No mover un componente completo a otro archivo solo para reducir el número de líneas del original. El tamaño, por sí solo, no justifica una extracción.
- No crear archivos que únicamente renombren o reexporten un componente interno. Actualizar los imports para usar directamente el componente compartido.
- No crear wrappers de un solo uso que únicamente pasen props o fijen una opción. Usar el componente directamente en el consumidor.
- Una excepción es válida cuando cumple una obligación concreta, por ejemplo las rutas de Expo Router en `app/`, una API pública que deba conservar compatibilidad o un wrapper que añada comportamiento propio. Explicar el motivo real; no asumir que toda capa mejora la arquitectura.
- Extraer los controles duplicados cuando deban compartir comportamiento y correcciones. Mantener juntos los detalles que solo utiliza un componente, salvo que exista otra responsabilidad clara.
- Revisar el resultado antes de terminar: cada archivo nuevo debe aportar algo más que otro salto de navegación para entender el código.

## Cambios acotados y verificación

- Cada cambio debe responder al pedido actual. No refactorizar, renombrar ni limpiar código ajeno al objetivo.
- Eliminar los imports, variables y archivos que el propio cambio deje sin uso. No aprovechar para limpiar código preexistente sin relación.
- Respetar el formato y lint configurados, limitando el formateo a los archivos modificados. Si un problema previo bloquea una comprobación requerida, hacer la corrección mínima y comunicarlo.
- Verificar lo que realmente cambia con comprobaciones proporcionales. No añadir tests que solo repitan la implementación ni pruebas de comportamiento para simples cambios de documentación.
- Añadir comentarios básicos en español a los métodos creados o modificados, explicando su objetivo y los pasos que lo necesiten.
- En frontend, reutilizar los componentes y tokens del design system; no introducir estilos o componentes paralelos sin necesidad.

## Skill de apoyo

Usar `karpathy-guidelines` al escribir, revisar o refactorizar código, cuando esté disponible. Está instalada globalmente en Codex desde [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills/tree/main/skills/karpathy-guidelines). Esta instalación es local a cada desarrollador; las reglas anteriores permanecen en el repositorio aunque la skill no esté instalada. No sustituir las instrucciones específicas del proyecto por las de una skill.

## Git

- Usar prefijos convencionales en ramas: `feat/`, `fix/`, `refactor/`, `docs/` o `chore/`, según el trabajo.
- Usar prefijos convencionales en commits y una descripción en español, por ejemplo `refactor: elimina intermediarios del editor de lectura`.
