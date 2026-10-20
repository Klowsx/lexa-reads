import { getAuthRedirect } from '~/features/auth/auth-route'

const completed = { onboarding_completed: true, onboarding_step: 3 }
const pending = { onboarding_completed: false, onboarding_step: 2 }

// Facilita comprobar que la misma regla cubre tanto rutas públicas como privadas.
function destination(
  segments: string[],
  hasSession = true,
  isRecoveryMode = false,
  profile = completed
) {
  return getAuthRedirect({ segments, hasSession, isRecoveryMode, profile })
}

describe('Acceso al MVP', () => {
  it('centraliza la entrada para que no compita con los enlaces o la recuperación', () => {
    expect(destination([])).toBe('/(tabs)/feed')
    expect(destination(['index'], true, true)).toBe('/(auth)/new-password')
    expect(destination([], false)).toBe('/(auth)')
    expect(destination([], true, false, pending)).toBe(
      '/(auth)/onboarding/goal'
    )
  })
  it('permite consumir un callback antes de decidir el destino', () => {
    expect(destination(['(auth)', 'auth-callback'])).toBeNull()
    expect(destination(['(auth)', 'auth-callback'], false)).toBeNull()
  })
  it('protege las pantallas privadas sin sesión', () => {
    expect(destination(['(tabs)', 'feed'], false)).toBe('/(auth)')
    expect(destination(['(auth)', 'onboarding', 'username'], false)).toBe(
      '/(auth)/login'
    )
  })
  it('mantiene la recuperación separada del feed y del onboarding', () => {
    expect(destination(['(tabs)', 'feed'], true, true)).toBe(
      '/(auth)/new-password'
    )
    expect(destination(['(auth)', 'onboarding'], true, true, pending)).toBe(
      '/(auth)/new-password'
    )
    expect(destination(['(auth)', 'new-password'], true, true)).toBeNull()
  })
  it('deja que la pantalla de contraseña explique una sesión ausente sin interrumpir el cierre', () => {
    expect(destination(['(auth)', 'new-password'], false)).toBeNull()
  })
  it('reanuda las preferencias guardadas y evita repetir el onboarding completado', () => {
    expect(destination(['(auth)', 'login'], true, false, pending)).toBe(
      '/(auth)/onboarding/goal'
    )
    expect(destination(['(auth)', 'onboarding'], true, false)).toBe(
      '/(tabs)/feed'
    )
  })
  it('espera al perfil antes de decidir un acceso normal', () => {
    expect(
      getAuthRedirect({
        segments: ['(auth)', 'login'],
        hasSession: true,
        isRecoveryMode: false
      })
    ).toBeNull()
  })
})
