import { authStorage } from '~/lib/auth-storage'

const RECOVERY_KEY = 'lexa.auth.recovery-user'
type RecoveryContext = { userId: string; passwordUpdated: boolean }

// Conserva la cuenta y el paso de recuperación al cerrar la aplicación a mitad del proceso.
export async function saveRecoveryContext(
  userId: string | null,
  passwordUpdated = false
): Promise<void> {
  if (userId)
    await authStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({ userId, passwordUpdated })
    )
  else await authStorage.removeItem(RECOVERY_KEY)
}

// Reanuda únicamente el flujo de la misma cuenta y acepta el marcador de versiones anteriores.
export async function readRecoveryContext(
  userId: string
): Promise<{ isRecoveryMode: boolean; passwordUpdated: boolean }> {
  const value = await authStorage.getItem(RECOVERY_KEY)
  if (!value) return { isRecoveryMode: false, passwordUpdated: false }
  if (!value.startsWith('{'))
    return { isRecoveryMode: value === userId, passwordUpdated: false }
  const context = JSON.parse(value) as RecoveryContext
  const matches = context.userId === userId
  return {
    isRecoveryMode: matches,
    passwordUpdated: matches && context.passwordUpdated === true
  }
}
