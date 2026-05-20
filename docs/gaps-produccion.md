# Gaps de producción — Lexa Reads

> Diagnóstico de lo que falta o está mal definido antes de salir a producción.
> Ordenado por cuándo hay que resolverlo: **antes de tirar código** vs **al final**.

---

## PENDIENTES

---

### ⬜ 0.3 `app.json` incompleto para producción

Faltan los campos que bloquean el submit a tiendas y el deep linking del MVP:

```jsonc
// Agregar:
"ios": {
  "bundleIdentifier": "com.tuempresa.lexa"   // App Store — OBLIGATORIO
},
"android": {
  "package": "com.tuempresa.lexa"            // Play Store — OBLIGATORIO
},
"scheme": "lexa",                             // Deep linking (listas, libros, perfiles)
"extra": {
  "eas": { "projectId": "..." }              // EAS Build
}
```

Sin `bundleIdentifier` / `package` no se puede subir a ninguna tienda.
Sin `scheme` los deep links del MVP (listas, libros compartidos) no funcionan.

---

### ⬜ 0.4 No existe `eas.json`

Sin este archivo `eas build` falla. Define los perfiles de build (development / preview / production).

```jsonc
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

### ⬜ 0.8 Scaffold de `src/features/` — parcial

**Pendiente:** Features de feed, library, book, lists y user + `src/components/ui/` — se crean cuando se empiece cada feature. Auth ya tiene scaffold.

---

### ⬜ 0.9 `src/lib/query-options.ts` y `src/lib/google-books.ts`

Ambos son reglas arquitectónicas duras (CLAUDE.md §5 y §4). Si no existen desde el inicio, las primeras queries romperán el patrón y habrá que refactorizar.

- `query-options.ts` — factory de `queryOptions` (TanStack v5)
- `google-books.ts` — wrapper DB-first: busca en tabla `books` primero, si no existe llama la API y guarda

---

## COMPLETADOS

---

### ✅ 0.1 Bug de hooks en `app/_layout.tsx`

~~Los dos `useEffect` estaban después del `return null` condicional, violando las reglas de React Hooks.~~

**Resuelto:** Ambos `useEffect` movidos antes del `if (!fontsLoaded) return null`.

---

### ✅ 0.2 No existían las rutas del AuthGate

~~`_layout.tsx` intentaba navegar a `/(auth)/login` y `/(tabs)/feed` pero ninguno existía.~~

**Resuelto:** Creados `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/feed.tsx` como placeholders.

---

### ✅ 0.5 `react-native-reanimated` no instalado

~~No estaba en `package.json`. Cualquier componente que lo importara crasheaba en runtime.~~

**Resuelto:** Ya estaba instalado. Agregado `react-native-reanimated/plugin` a `babel.config.js` que faltaba.

---

### ✅ 0.6 i18n sin configurar

~~`i18next` y `expo-localization` instalados pero sin nada cableado.~~

**Resuelto:**

- `src/lib/i18n.ts` — inicialización con locale del dispositivo, fallback ES
- `src/locales/es.json` y `en.json` — keys para auth, common, book, feed
- `import "~/lib/i18n"` + `<I18nextProvider>` en `app/_layout.tsx`

---

### ✅ 0.7 `tsconfig.json` — `"types": ["jest"]` global

~~`expect()`, `describe()`, `it()` pasaban typecheck en archivos de producción.~~

**Resuelto:**

- Eliminado `"types": ["jest"]` de `tsconfig.json`
- Creado `tsconfig.test.json` con los tipos de Jest aislados
- `@testing-library/jest-native` (deprecado) eliminado; migrado a matchers built-in de `@testing-library/react-native` v13

---

### ✅ 1.1 Sentry — instalado, no inicializado

~~`@sentry/react-native` estaba sin `Sentry.init()` en ningún lado.~~

**Resuelto:**

- `Sentry.init()` en `app/_layout.tsx` antes del componente (desactivado en dev)
- `export default Sentry.wrap(RootLayout)` para capturar crashes del árbol de navegación
- `EXPO_PUBLIC_SENTRY_DSN` agregado a `.env.example`
- Pendiente: agregar `sourceMaps: true` al perfil production de `eas.json` cuando se cree

---

### ✅ 1.2 `app/+not-found.tsx`

~~Expo Router requiere esta pantalla para rutas no encontradas.~~

**Resuelto:** Creado `app/+not-found.tsx` con placeholder y link al feed.

---

### ✅ 1.3 `userInterfaceStyle: "automatic"` en `app.json`

~~`app.json` tenía `"userInterfaceStyle": "light"` hardcodeado.~~

**Resuelto:** Cambiado a `"automatic"`. Dark mode responde al sistema.

---

### ✅ 1.4 `expo-barcode-scanner` deprecado

~~Deprecado desde SDK 52, causaba warnings en build.~~

**Resuelto:** Eliminado de `package.json`. Usar `expo-camera` (SDK 54) que incluye barcode scanning nativo.

---

## Resumen visual

| #   | Item                                     | Fase            | Estado |
| --- | ---------------------------------------- | --------------- | ------ |
| 0.3 | `app.json` bundle IDs + scheme           | Antes de código | ⬜     |
| 0.4 | `eas.json`                               | Antes de código | ⬜     |
| 0.8 | Scaffold `src/features/` (parcial)       | Antes de código | ⬜     |
| 0.9 | `query-options.ts` + `google-books.ts`   | Antes de código | ⬜     |
| 0.1 | Fix hooks order en `_layout.tsx`         | Antes de código | ✅     |
| 0.2 | Crear rutas mínimas                      | Antes de código | ✅     |
| 0.5 | `react-native-reanimated` + babel plugin | Antes de código | ✅     |
| 0.6 | Setup i18n                               | Antes de código | ✅     |
| 0.7 | `tsconfig.json` types aislados           | Antes de código | ✅     |
| 1.1 | Sentry inicializado                      | Durante dev     | ✅     |
| 1.2 | `app/+not-found.tsx`                     | Durante dev     | ✅     |
| 1.3 | `userInterfaceStyle: "automatic"`        | Durante dev     | ✅     |
| 1.4 | Migrar de `expo-barcode-scanner`         | Durante dev     | ✅     |
