import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  onboardingStarted: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (v: boolean) => void;
  setOnboardingStarted: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  onboardingStarted: false,
  setSession: (session) =>
    set((s) => ({
      session,
      user: session?.user ?? null,
      onboardingStarted: session ? s.onboardingStarted : false,
    })),
  setLoading: (v) => set({ isLoading: v }),
  setOnboardingStarted: (v) => set({ onboardingStarted: v }),
}));
