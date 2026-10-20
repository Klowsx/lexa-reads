import { create } from 'zustand'
import { Appearance, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

export type ThemeMode = 'light' | 'dark' | 'system'
type Scheme = 'light' | 'dark'

const KEY = 'theme.mode'

function resolve(mode: ThemeMode): Scheme {
  if (mode === 'system') return Appearance.getColorScheme() ?? 'light'
  return mode
}

function apply(scheme: Scheme, mode: ThemeMode) {
  if (Platform.OS === 'web') {
    const el = (globalThis as any).document?.documentElement as
      HTMLElement | undefined
    el?.classList.toggle('dark', scheme === 'dark')
    return
  }
  Appearance.setColorScheme(mode === 'system' ? null : scheme)
}

interface ThemeState {
  mode: ThemeMode
  scheme: Scheme
  setMode: (mode: ThemeMode) => void
}

// SecureStore has no web implementation. Theme is a non-sensitive preference,
// so browser storage is the appropriate persistent store for the web preview.
async function loadMode(): Promise<ThemeMode> {
  try {
    const value =
      Platform.OS === 'web'
        ? globalThis.localStorage?.getItem(KEY)
        : await SecureStore.getItemAsync(KEY)
    if (value === 'light' || value === 'dark' || value === 'system')
      return value
  } catch {
    // A storage failure must never prevent a person from choosing a theme.
  }
  return 'system'
}

async function persistMode(mode: ThemeMode) {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(KEY, mode)
      return
    }
    await SecureStore.setItemAsync(KEY, mode)
  } catch {
    // The selected scheme remains active for this session if native storage is unavailable.
  }
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialScheme = resolve('system')
  apply(initialScheme, 'system')

  loadMode().then((mode) => {
    const scheme = resolve(mode)
    apply(scheme, mode)
    set({ mode, scheme })
  })

  Appearance.addChangeListener(() => {
    if (get().mode !== 'system') return
    const scheme = Appearance.getColorScheme() ?? 'light'
    apply(scheme, 'system')
    set({ scheme })
  })

  return {
    mode: 'system',
    scheme: initialScheme,
    setMode: (mode) => {
      const scheme = resolve(mode)
      apply(scheme, mode)
      set({ mode, scheme })
      void persistMode(mode)
    }
  }
})
