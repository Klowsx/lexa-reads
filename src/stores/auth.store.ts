import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isRecoveryMode: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (v: boolean) => void;
  setRecoveryMode: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isRecoveryMode: false,
  // Actualiza la sesión y elimina los estados transitorios cuando la sesión termina.
  setSession: (session) =>
    set((s) => ({
      session,
      user: session?.user ?? null,
      isRecoveryMode: session ? s.isRecoveryMode : false,
    })),
  setLoading: (v) => set({ isLoading: v }),
  setRecoveryMode: (v) => set({ isRecoveryMode: v }),
}));
