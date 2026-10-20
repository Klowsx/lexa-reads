import { getOnboardingRoute } from './onboarding-route'

type AuthRouteState = {
  segments: readonly string[]
  hasSession: boolean
  isRecoveryMode: boolean
  profile?: {
    onboarding_completed: boolean | null
    onboarding_step?: number
  } | null
}

// Prioriza los enlaces y la recuperación; el perfil persistido decide el acceso normal al MVP.
export function getAuthRedirect({
  segments,
  hasSession,
  isRecoveryMode,
  profile
}: AuthRouteState) {
  const inAuth = segments[0] === '(auth)'
  const screen = inAuth ? segments[1] : undefined
  if (screen === 'auth-callback') return null
  if (!hasSession) {
    if (!inAuth) return '/(auth)' as const
    if (screen === 'onboarding') return '/(auth)/login' as const
    // La pantalla exige sesión antes de mostrar campos y permite terminar el cierre tras guardar.
    if (screen === 'new-password') return null
    return null
  }
  if (isRecoveryMode)
    return screen === 'new-password' ? null : ('/(auth)/new-password' as const)
  if (!profile) return null
  if (segments.length === 0 || segments[0] === 'index') {
    return getOnboardingRoute(profile)
  }
  if (profile.onboarding_completed)
    return inAuth ? ('/(tabs)/feed' as const) : null
  return screen === 'onboarding' ? null : getOnboardingRoute(profile)
}
