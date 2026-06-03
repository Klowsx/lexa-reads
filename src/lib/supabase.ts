import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type { Database } from "~/types/database";

// A-2 (auditoría): en web no existe expo-secure-store, así que los tokens caen
// a `localStorage`, accesible por cualquier XSS. POSTURA DE PRODUCCIÓN: la web
// es SOLO dev/preview — NO es target de producción. Si en el futuro se publica
// la web como producto, migrar a cookies httpOnly servidas por un backend (el
// cliente anon de Supabase no puede setear httpOnly por sí solo).
// En nativo (iOS/Android) los tokens van a expo-secure-store (CLAUDE.md §10).
const ExpoSecureStoreAdapter = Platform.OS === "web"
  ? {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve(); },
      removeItem: (key: string) => { localStorage.removeItem(key); return Promise.resolve(); },
    }
  : (() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const SecureStore = require("expo-secure-store");
      return {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };
    })();

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
    },
  },
);
