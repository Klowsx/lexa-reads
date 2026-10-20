import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean
  isRecoveryMode: boolean
  isRecoveryPasswordUpdated: boolean
  setSession: (session: Session | null) => void
  setLoading: (v: boolean) => void
  setRecoveryMode: (v: boolean) => void
  setRecoveryPasswordUpdated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isRecoveryMode: false,
  isRecoveryPasswordUpdated: false,
  // Actualiza la sesión y elimina los estados transitorios cuando la sesión termina.
  setSession: (session) =>
    set((s) => ({
      session,
      user: session?.user ?? null,
      isRecoveryMode: session ? s.isRecoveryMode : false,
      isRecoveryPasswordUpdated: session ? s.isRecoveryPasswordUpdated : false
    })),
  setLoading: (v) => set({ isLoading: v }),
  // Al salir de recuperación elimina también su etapa transitoria.
  setRecoveryMode: (v) =>
    set((state) => ({
      isRecoveryMode: v,
      isRecoveryPasswordUpdated: v ? state.isRecoveryPasswordUpdated : false
    })),
  // Recuerda que el servidor ya aceptó la contraseña para reintentar solo el cierre.
  setRecoveryPasswordUpdated: (v) => set({ isRecoveryPasswordUpdated: v })
}))
