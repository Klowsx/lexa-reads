# Gaps de producción — Lexa Reads

> Diagnóstico de lo que falta o está mal definido antes de salir a producción.
> Ordenado por cuándo hay que resolverlo: **antes de tirar código** vs **al final**.

---

## FASE 0 — Resolver ANTES de escribir cualquier feature

Estos bloquean desde el inicio: la app no abre, los builds no corren, o el resto del código se construye sobre una base rota.

---

### 0.1 Bug de hooks en `app/_layout.tsx` — CRASH inmediato

**Problema:** Los dos `useEffect` están después del `return null` condicional, violando las reglas de React Hooks. Crashea en StrictMode.

```tsx
// Estado actual — INCORRECTO
if (!fontsLoaded) return null;
useEffect(() => { ... }, []);  // ← hook después de return = crash
useEffect(() => { ... }, []);
```

**Fix:** Mover ambos `useEffect` antes del `if (!fontsLoaded)`.

---

### 0.2 No existen las rutas del AuthGate

`_layout.tsx` intenta navegar a `/(auth)/login` y `/(tabs)/feed` pero ninguno existe. La app abre y crashea de inmediato.

**Pendiente:** Crear al menos los archivos de ruta vacíos para que Expo Router los resuelva mientras se desarrolla.

---

### 0.3 `app.json` incompleto para producción

Faltan los campos que bloquean el submit a tiendas y el deep linking del MVP:

```jsonc
// Agregar:
"ios": {
  "bundleIdentifier": "com.tuempresa.lexa",   // App Store — OBLIGATORIO
  "supportsTablet": true
},
"android": {
  "package": "com.tuempresa.lexa",            // Play Store — OBLIGATORIO
  "adaptiveIcon": { ... },
  "edgeToEdgeEnabled": true
},
"scheme": "lexa",                              // Deep linking (listas, libros, perfiles)
"extra": {
  "eas": { "projectId": "..." }               // EAS Build
}
```

Sin `bundleIdentifier` / `package` no se puede subir a ninguna tienda.
Sin `scheme` los deep links del MVP (listas, libros compartidos) no funcionan.

---

### 0.4 No existe `eas.json`

Sin este archivo `eas build` falla. Define los perfiles de build (development / preview / production).

```jsonc
// eas.json mínimo
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
    },
    "preview": {
      "distribution": "internal",
    },
    "production": {},
  },
  "submit": {
    "production": {},
  },
}
```

---

### 0.5 `react-native-reanimated` no instalado

STACK.md lo marca como requerido para las microinteracciones del feed, pero **no está en `package.json`**. Cualquier componente que lo importe crasheará en runtime.

```bash
pnpm add react-native-reanimated
```

También hay que agregarlo al `babel.config.js`:

```js
plugins: ["react-native-reanimated/plugin"];
```

---

### 0.6 i18n sin configurar

`i18next` y `expo-localization` están instalados pero no hay nada cableado. El MVP promete soporte ES + EN desde el día 1. Sin esto, no hay forma de agregar strings localizados a ninguna pantalla.

**Lo que falta:**

- `src/lib/i18n.ts` — inicialización de i18next con expo-localization
- `src/locales/es.json` y `en.json` — archivos de traducción
- `<I18nextProvider>` en el root layout

Definir la estructura de namespaces antes de escribir screens evita un refactor global después.

---

### 0.7 `tsconfig.json` — `"types": ["jest"]` global

```jsonc
// Estado actual — contamina producción con tipos de Jest
"types": ["jest"]
```

`expect()`, `describe()`, `it()` pasan typecheck en archivos que no son tests. Mover a una `tsconfig.test.json` separada y configurar Jest para usarla.

```jsonc
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-native"],
  },
}
```

---

### 0.8 Scaffold de `src/features/` y `src/components/ui/`

No existe ninguno de los dos. Antes de escribir la primera feature hay que definir la estructura de carpetas para que todo el equipo (o futuras sesiones) siga el mismo patrón:

```
src/
├── features/
│   ├── auth/       { hooks/, components/ }
│   ├── feed/       { hooks/, components/ }
│   ├── library/    { hooks/, components/ }
│   ├── book/       { hooks/, components/ }
│   ├── lists/      { hooks/, components/ }
│   └── user/       { hooks/, components/ }
└── components/ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Skeleton.tsx
    ├── QueryBoundary.tsx
    ├── ErrorState.tsx
    ├── EmptyState.tsx
    └── Toast.tsx
```

Los átomos de UI (`QueryBoundary`, `Skeleton`, `Button`) los necesita la primera pantalla que escribas.

---

### 0.9 `src/lib/query-options.ts` y `src/lib/google-books.ts`

Ambos son reglas arquitectónicas duras (CLAUDE.md §5 y §4). Si no existen desde el inicio, las primeras queries romperán el patrón y habrá que refactorizar.

- `query-options.ts` — factory de `queryOptions` (TanStack v5)
- `google-books.ts` — wrapper DB-first: busca en tabla `books` primero, si no existe llama la API y guarda

---

## FASE 1 — Durante el desarrollo (antes del primer build de TestFlight)

Funcionalidad prometida que hay que cablear antes de que los primeros usuarios toquen la app.

---

### 1.1 Sentry — instalado, no inicializado

`@sentry/react-native` está en `package.json` pero no hay `Sentry.init()` en ningún lado. Sin esto los crashes en producción son invisibles. STACK.md lo marca como obligatorio en builds de TestFlight/internal.

**Lo que falta:**

- `Sentry.init()` al inicio de `app/_layout.tsx`
- DSN en variable de entorno (`EXPO_PUBLIC_SENTRY_DSN`)
- Configuración de `sourceMaps` en `eas.json` para que los stack traces sean legibles

---

### 1.2 `app/+not-found.tsx`

Expo Router requiere esta pantalla para rutas no encontradas. Sin ella muestra un error poco claro en lugar de una pantalla de 404 navegable.

---

### 1.3 `userInterfaceStyle: "automatic"` en `app.json`

El design system tiene dark mode completo (CSS vars en `global.css`, `rawDark` en `colors.ts`), pero `app.json` tiene `"userInterfaceStyle": "light"` hardcodeado. iOS mostrará el status bar incorrecto y NativeWind no responderá al tema del sistema.

Cambiar a `"automatic"`.

---

### 1.4 `expo-barcode-scanner` deprecado

Deprecado desde SDK 52. Ya tienen `expo-camera` instalado (SDK 54) que incluye barcode scanning nativo. Quitar `expo-barcode-scanner` antes de que Expo lo retire completamente y cause un error de build.

```bash
pnpm remove expo-barcode-scanner
# Migrar al BarcodeScanner integrado en expo-camera
```

---

## FASE 2 — Antes del submit a stores (al final)

Se pueden implementar con la app ya funcionando. No bloquean el desarrollo pero sí el lanzamiento.

---

### 2.1 PostHog — instalado, no inicializado

`posthog-react-native` instalado pero sin `PostHogProvider` ni flujo de consentimiento. Las tiendas requieren que analytics sea opt-in.

**Lo que falta:**

- `PostHogProvider` en root layout
- Pantalla/modal de consentimiento granular (GDPR/LGPD)
- PostHog solo se inicializa después de que el usuario acepta

---

### 2.2 Checklist de compliance de stores (del STACK.md)

Estos son bloqueantes para App Store / Play Store pero se implementan sobre features ya existentes:

- [ ] Reporte de contenido in-app con acuse ≤24h (App Store 1.2 / Play UGC)
- [ ] Borrado de cuenta in-app con anonimización diferida 30 días (Apple lo exige desde 2022)
- [ ] Política de privacidad pública con URL accesible
- [ ] Export de datos del usuario (Edge Function)
- [ ] Push opt-in contextual — no al primer launch
- [ ] App Store Connect: privacy nutrition labels
- [ ] Play Console: data safety form

---

### 2.3 `eas.json` — configuración de sourcemaps y submit

El `eas.json` mínimo de Fase 0 alcanza para hacer builds. Antes del submit final hay que configurar:

- `sourceMaps: true` en el perfil production (para Sentry)
- `submit` con credenciales de App Store Connect y Google Play

---

## Resumen visual

| #   | Item                                            | Fase            | Impacto si se omite                |
| --- | ----------------------------------------------- | --------------- | ---------------------------------- |
| 0.1 | Fix hooks order en `_layout.tsx`                | Antes de código | Crash al abrir                     |
| 0.2 | Crear rutas mínimas                             | Antes de código | Crash al abrir                     |
| 0.3 | `app.json` bundle IDs + scheme                  | Antes de código | No se puede subir a stores         |
| 0.4 | `eas.json`                                      | Antes de código | No hay builds                      |
| 0.5 | Instalar `react-native-reanimated`              | Antes de código | Crash en runtime                   |
| 0.6 | Setup i18n                                      | Antes de código | Refactor global después            |
| 0.7 | `tsconfig.json` types aislados                  | Antes de código | Typechecking sucio                 |
| 0.8 | Scaffold `src/features/` + `src/components/ui/` | Antes de código | Sin estructura para features       |
| 0.9 | `query-options.ts` + `google-books.ts`          | Antes de código | Rompe arquitectura desde feature 1 |
| 1.1 | Sentry inicializado                             | Durante dev     | Crashes invisibles en prod         |
| 1.2 | `app/+not-found.tsx`                            | Durante dev     | Error poco claro en rutas rotas    |
| 1.3 | `userInterfaceStyle: "automatic"`               | Durante dev     | Dark mode no funciona              |
| 1.4 | Migrar de `expo-barcode-scanner`                | Durante dev     | Build roto en SDK futuro           |
| 2.1 | PostHog + consentimiento                        | Antes de submit | Rechazo de stores                  |
| 2.2 | Compliance stores (reporte, borrado, etc.)      | Antes de submit | Rechazo de stores                  |
| 2.3 | `eas.json` sourcemaps + submit config           | Antes de submit | Stack traces ilegibles             |
