Plan: Scaffold inicial de Lexa

Contexto

El template tabs de create-expo-app instaló Expo Router y la estructura básica de rutas, pero el proyecto necesita
configuración adicional antes de escribir cualquier feature: renombrar la app de "app" a "lexa", instalar el stack
completo del CLAUDE.md, configurar NativeWind, crear la estructura src/, y limpiar los componentes de demo del
template.

Archivo crítico de referencia: C:\Users\jhernandez\Desktop\Yo\Lexa\CLAUDE.md

---

Paso 1 — Corregir metadatos del proyecto

app/app.json

- name: "app" → "lexa"
- slug: "app" → "lexa"
- scheme: "app" → "lexa"

app/package.json

- name: "app" → "lexa"
- Agregar "packageManager": "pnpm@10.11.0"
- Agregar script "preinstall": "npx only-allow pnpm"

---

Paso 2 — Instalar dependencias

Desde app/, un solo pnpm add:

# Runtime deps

pnpm add @supabase/supabase-js \
 expo-secure-store \
 @tanstack/react-query \
 zustand \
 nativewind \
 tailwindcss \
 @shopify/flash-list \
 expo-image \
 react-hook-form \
 zod \
 react-native-gesture-handler \
 react-native-mmkv \
 expo-localization \
 i18next \
 react-i18next \
 expo-camera \
 expo-barcode-scanner \
 @sentry/react-native \
 posthog-react-native

# Dev deps

pnpm add -D babel-plugin-nativewind

Notas:

- react-native-reanimated ya viene con el template (v4.1.1) ✅
- react-native-gesture-handler es par necesario de Reanimated ✅

---

Paso 3 — Configurar NativeWind

Crear app/tailwind.config.js:
/** @type {import('tailwindcss').Config} \*/
module.exports = {
content: ['./app/**/_.{ts,tsx}', './src/\*\*/_.{ts,tsx}'],
presets: [require('nativewind/preset')],
theme: { extend: {} },
plugins: [],
}

Crear app/babel.config.js (el template no lo tiene explícito):
module.exports = function (api) {
api.cache(true)
return {
presets: [
['babel-preset-expo', { jsxImportSource: 'nativewind' }],
],
plugins: ['nativewind/babel'],
}
}

Crear app/metro.config.js:
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(\_\_dirname)
module.exports = withNativeWind(config, { input: './global.css' })

Crear app/global.css:
@tailwind base;
@tailwind components;
@tailwind utilities;

Crear app/nativewind-env.d.ts:
/// <reference types="nativewind/types" />

Actualizar app/tsconfig.json — agregar path alias para src/:
{
"extends": "expo/tsconfig.base",
"compilerOptions": {
"strict": true,
"paths": {
"@/_": ["./_"],
"~/_": ["./src/_"]
}
}
}

---

Paso 4 — Crear estructura src/

src/
├── features/
│ ├── feed/
│ ├── library/
│ ├── book/
│ ├── auth/
│ ├── lists/
│ └── user/
├── components/
│ └── ui/ ← Button, Input, Skeleton, QueryBoundary, etc. (vacíos por ahora)
├── stores/
│ ├── auth.store.ts
│ └── ui.store.ts
├── lib/
│ ├── supabase.ts
│ ├── query-client.ts
│ ├── query-options.ts
│ ├── google-books.ts
│ └── utils.ts
├── types/
│ ├── database.ts ← placeholder (se regenera con supabase gen types)
│ ├── errors.ts
│ └── index.ts
└── constants/
└── theme.ts

Archivos a crear con contenido real:

src/lib/supabase.ts — cliente con expo-secure-store:
import { createClient } from '@supabase/supabase-js'
import \* as SecureStore from 'expo-secure-store'
import type { Database } from '~/types/database'

const ExpoSecureStoreAdapter = {
getItem: (key: string) => SecureStore.getItemAsync(key),
setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient<Database>(
process.env.EXPO_PUBLIC_SUPABASE_URL!,
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
{ auth: { storage: ExpoSecureStoreAdapter, autoRefreshToken: true, persistSession: true } }
)

src/lib/query-client.ts — QueryClient con toasts en error:
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
defaultOptions: {
queries: { retry: 1, staleTime: 1000 _ 60 _ 5 },
mutations: { onError: (err) => { /_ dispatch toast _/ } },
},
})

src/stores/auth.store.ts — proyección de onAuthStateChange:
import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
session: Session | null
user: User | null
setSession: (s: Session | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
session: null,
user: null,
setSession: (s) => set({ session: s, user: s?.user ?? null }),
}))

src/stores/ui.store.ts — toast queue:
import { create } from 'zustand'

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' }

interface UiState {
toasts: Toast[]
addToast: (t: Omit<Toast, 'id'>) => void
removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
toasts: [],
addToast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }] })),
removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

src/types/errors.ts — AppError unificado:
export type AppErrorCode = 'network' | 'auth' | 'not_found' | 'forbidden' | 'unknown'

export class AppError extends Error {
constructor(public code: AppErrorCode, message: string) {
super(message)
}
}

---

Paso 5 — Limpiar template y estructurar rutas

Borrar (archivos de demo del template):

- app/components/ (todo)
- app/constants/Colors.ts
- app/app/(tabs)/two.tsx
- app/app/modal.tsx
- app/app/+html.tsx (web, no aplica en MVP)

Crear rutas finales MVP:
app/app/
├── \_layout.tsx ← Root layout (providers + auth gate)
├── +not-found.tsx ← ya existe
├── (auth)/
│ ├── \_layout.tsx
│ ├── login.tsx
│ └── register.tsx
└── (tabs)/
├── \_layout.tsx ← 4 tabs: feed, search, library, profile
├── feed.tsx
├── search.tsx
├── library.tsx
└── profile.tsx

Rutas de detalle (crear como placeholders):

- app/app/book/[id].tsx
- app/app/user/[username].tsx
- app/app/list/[slug].tsx
- app/app/settings.tsx

app/app/\_layout.tsx — root layout según CLAUDE.md:
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import { focusManager } from '@tanstack/react-query'
import { queryClient } from '~/lib/query-client'
import { supabase } from '~/lib/supabase'
import { useAuthStore } from '~/stores/auth.store'
import '../global.css'

export default function RootLayout() {
const setSession = useAuthStore((s) => s.setSession)

useEffect(() => {
supabase.auth.getSession().then(({ data }) => setSession(data.session))
const { data: { subscription } } = supabase.auth.onAuthStateChange((\_e, s) => setSession(s))
return () => subscription.unsubscribe()
}, [])

useEffect(() => {
const sub = AppState.addEventListener('change', (s) => {
if (Platform.OS !== 'web') focusManager.setFocused(s === 'active')
})
return () => sub.remove()
}, [])

return (
<QueryClientProvider client={queryClient}>
<Stack screenOptions={{ headerShown: false }} />
</QueryClientProvider>
)
}

---

Paso 6 — Variables de entorno

Crear app/.env.local:
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

(Agregar .env.local al .gitignore)

---

Orden de ejecución

1.  Editar app.json y package.json
2.  pnpm install (todas las deps de una vez)
3.  Crear archivos de config NativeWind (tailwind, babel, metro, global.css)
4.  Crear estructura src/ con todos los archivos
5.  Limpiar template y crear rutas
6.  Crear .env.local
7.  Verificar: pnpm start → sin errores de TypeScript

Verificación

cd app && pnpm start

- Sin errores en consola al iniciar
- La app carga en simulador/Expo Go con tabs vacíos
- TypeScript no reporta errores (pnpm tsc --noEmit)
