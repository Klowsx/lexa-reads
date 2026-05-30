import { create } from "zustand";
import { Appearance, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "light" | "dark" | "system";
type Scheme = "light" | "dark";

const KEY = "theme.mode";

function resolve(mode: ThemeMode): Scheme {
  if (mode === "system") return Appearance.getColorScheme() ?? "light";
  return mode;
}

function apply(scheme: Scheme, mode: ThemeMode) {
  if (Platform.OS === "web") {
    const el = (globalThis as any).document?.documentElement as
      | HTMLElement
      | undefined;
    el?.classList.toggle("dark", scheme === "dark");
    return;
  }
  Appearance.setColorScheme(mode === "system" ? null : scheme);
}

interface ThemeState {
  mode: ThemeMode;
  scheme: Scheme;
  setMode: (mode: ThemeMode) => void;
}

async function loadMode(): Promise<ThemeMode> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialScheme = resolve("system");
  apply(initialScheme, "system");

  loadMode().then((mode) => {
    const scheme = resolve(mode);
    apply(scheme, mode);
    set({ mode, scheme });
  });

  Appearance.addChangeListener(() => {
    if (get().mode !== "system") return;
    const s = Appearance.getColorScheme() ?? "light";
    apply(s, "system");
    set({ scheme: s });
  });

  return {
    mode: "system",
    scheme: initialScheme,
    setMode: async (mode) => {
      await SecureStore.setItemAsync(KEY, mode);
      const s = resolve(mode);
      apply(s, mode);
      set({ mode, scheme: s });
    },
  };
});
