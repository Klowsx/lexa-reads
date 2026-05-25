import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import { Appearance, Platform } from "react-native";

export type ThemeMode = "light" | "dark" | "system";
type Scheme = "light" | "dark";

const storage = createMMKV({ id: "lexa.prefs" });
const KEY = "theme.mode";

function load(): ThemeMode {
  const v = storage.getString(KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

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
  // En native: liberar override en "system", forzar en los otros.
  Appearance.setColorScheme(mode === "system" ? null : scheme);
}

interface ThemeState {
  mode: ThemeMode;
  scheme: Scheme;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialMode = load();
  const initialScheme = resolve(initialMode);
  apply(initialScheme, initialMode);

  Appearance.addChangeListener(() => {
    if (get().mode !== "system") return;
    const s = Appearance.getColorScheme() ?? "light";
    apply(s, "system");
    set({ scheme: s });
  });

  return {
    mode: initialMode,
    scheme: initialScheme,
    setMode: (mode) => {
      storage.set(KEY, mode);
      const s = resolve(mode);
      apply(s, mode);
      set({ mode, scheme: s });
    },
  };
});
