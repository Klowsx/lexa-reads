// Este archivo se genera desde src/theme/tokens.json. No editar manualmente.
import { useThemeStore } from '~/stores/theme.store'

// Valores para StyleSheet.create() o cuando no hay acceso a clases NativeWind.
export const rawDark = {
  bg: '#121316',
  surface: '#1a1c22',
  sr: '#23252e',
  sh: '#31353e',
  border: '#454855',
  text: '#f8fafc',
  t2: '#b6bfcd',
  t3: '#a2aaba',
  accent: '#f8fafc',
  onAccent: '#121316',
  error: '#ffb4ab',
  success: '#77dda5',
  warning: '#ffb77d',
  star: '#f9b747',
  status: {
    reading: '#f5b259',
    read: '#77dda5',
    want: '#a6c8ff',
    abandoned: '#b6bfcd'
  }
} as const

export const rawLight = {
  bg: '#fff8f5',
  surface: '#ffffff',
  sr: '#f6ece6',
  sh: '#eae1da',
  border: '#c6c6cd',
  text: '#1f1b17',
  t2: '#45464d',
  t3: '#62636b',
  accent: '#000000',
  onAccent: '#ffffff',
  error: '#ba1a1a',
  success: '#146c37',
  warning: '#8a4b00',
  star: '#a26000',
  status: {
    reading: '#9b4a00',
    read: '#146c37',
    want: '#245fc4',
    abandoned: '#545d6b'
  }
} as const

// Colores semánticos que no cambian entre tema claro y oscuro.
export const fixed = {
  accent: '#000000',
  accentAlt: {
    blue: '#245fc4',
    green: '#146c37',
    rose: '#a13a57'
  },
  star: '#a26000',
  error: '#ba1a1a',
  warning: '#8a4b00',
  success: '#146c37',
  onAccent: '#ffffff',
  cover: {
    ink: '#F0EAE2',
    backgrounds: [
      '#3D2B1F',
      '#1F3D2B',
      '#1F2B3D',
      '#3D1F2B',
      '#2B3D1F',
      '#2B1F3D'
    ]
  },
  status: {
    reading: '#9b4a00',
    read: '#146c37',
    want: '#245fc4',
    abandoned: '#545d6b'
  },
  avatar: {
    profile: ['#C4783A', '#4A96B8', '#5B9A6A', '#B8445A', '#8A6CD8', '#C49A20'],
    derived: [
      '#C4783A',
      '#4A96B8',
      '#5CAF7E',
      '#8A6CD8',
      '#B8445A',
      '#C49A20',
      '#3A8AB8',
      '#7E5CAF'
    ]
  }
} as const

type ThemePalette = {
  [K in keyof typeof rawDark]: (typeof rawDark)[K] extends string
    ? string
    : { [N in keyof (typeof rawDark)[K]]: string }
}

export type AppColors = Omit<typeof fixed, keyof ThemePalette> & ThemePalette

// Devuelve la paleta del tema activo junto con los colores semánticos fijos.
export function useColors(): AppColors {
  const scheme = useThemeStore((state) => state.scheme)
  const raw = scheme === 'dark' ? rawDark : rawLight
  return { ...fixed, ...raw } as AppColors
}

// Convierte un hexadecimal en rgba para usar transparencias sin duplicar colores.
export function alpha(hex: string, opacity: number): string {
  const numericColor = Number.parseInt(hex.replace('#', ''), 16)
  return (
    'rgba(' +
    (numericColor >> 16) +
    ',' +
    ((numericColor >> 8) & 255) +
    ',' +
    (numericColor & 255) +
    ',' +
    opacity +
    ')'
  )
}
