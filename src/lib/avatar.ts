import { fixed } from '~/theme/colors'

const PALETTE = fixed.avatar.profile

// Genera las iniciales que se muestran cuando el usuario no tiene avatar.
export function getInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// Asigna un color estable de la paleta central según el nombre de usuario.
export function getAvatarColor(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
