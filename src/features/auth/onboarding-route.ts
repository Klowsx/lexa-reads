type OnboardingState = {
  onboarding_completed: boolean | null
  onboarding_step?: number
}

// Elige el destino a partir del avance guardado, incluido el salto de preferencias.
export function getOnboardingRoute(profile: OnboardingState) {
  if (profile.onboarding_completed) return '/(tabs)/feed' as const
  if (profile.onboarding_step === 4)
    return '/(auth)/onboarding/suggestions' as const
  if (profile.onboarding_step === 3)
    return '/(auth)/onboarding/username' as const
  if (profile.onboarding_step === 2) return '/(auth)/onboarding/goal' as const
  return '/(auth)/onboarding/genres' as const
}
