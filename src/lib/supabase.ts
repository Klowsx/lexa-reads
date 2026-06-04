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

      // NEW-4 (auditoría): expo-secure-store usa el Keystore de Android, que
      // avisa/falla con valores > 2048 bytes. La sesión de Supabase (JWT +
      // refresh token, a veces con claims extra de OAuth) puede superarlo →
      // la sesión no persiste y el usuario es deslogueado al reabrir la app.
      // Fix: fragmentar el valor en trozos < 2048 bytes. Guardamos un
      // contador de fragmentos en la clave base y cada trozo en `${key}.N`.
      const CHUNK = 2000;

      async function clearChunks(key: string, count: number) {
        const ops: Promise<void>[] = [];
        for (let i = 0; i < count; i++) ops.push(SecureStore.deleteItemAsync(`${key}.${i}`));
        await Promise.all(ops);
      }

      return {
        getItem: async (key: string): Promise<string | null> => {
          const meta = await SecureStore.getItemAsync(key);
          if (meta == null) return null;
          // Compatibilidad con valores legados (no fragmentados): si no es un
          // descriptor "chunks:N", devolverlo tal cual.
          const match = /^chunks:(\d+)$/.exec(meta);
          if (!match) return meta;
          const count = Number(match[1]);
          const parts: string[] = [];
          for (let i = 0; i < count; i++) {
            const part = await SecureStore.getItemAsync(`${key}.${i}`);
            if (part == null) return null; // fragmento perdido → sesión inválida
            parts.push(part);
          }
          return parts.join("");
        },
        setItem: async (key: string, value: string): Promise<void> => {
          // Limpiar fragmentos previos para no dejar huérfanos si el valor encoge.
          const prevMeta = await SecureStore.getItemAsync(key);
          const prevMatch = prevMeta ? /^chunks:(\d+)$/.exec(prevMeta) : null;
          if (prevMatch) await clearChunks(key, Number(prevMatch[1]));

          if (value.length <= CHUNK) {
            await SecureStore.setItemAsync(key, value);
            return;
          }
          const count = Math.ceil(value.length / CHUNK);
          const ops: Promise<void>[] = [];
          for (let i = 0; i < count; i++) {
            ops.push(SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK)));
          }
          await Promise.all(ops);
          await SecureStore.setItemAsync(key, `chunks:${count}`);
        },
        removeItem: async (key: string): Promise<void> => {
          const meta = await SecureStore.getItemAsync(key);
          const match = meta ? /^chunks:(\d+)$/.exec(meta) : null;
          if (match) await clearChunks(key, Number(match[1]));
          await SecureStore.deleteItemAsync(key);
        },
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
