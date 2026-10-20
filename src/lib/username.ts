export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/

// Convierte el texto escrito en un nombre de usuario permitido por el onboarding.
export function normalizeUsername(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30)
}
