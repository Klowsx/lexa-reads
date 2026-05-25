import { useColorScheme } from 'react-native';

// Valores raw para uso en StyleSheet.create() o cuando no hay acceso a clases Tailwind
export const rawDark = {
  bg:      '#100D0A',
  surface: '#1C1815',
  sr:      '#252118',
  sh:      '#2D2922',
  border:  '#35302B',
  text:    '#F0EAE2',
  t2:      '#9E9488',
  t3:      '#6A635C',
} as const;

export const rawLight = {
  bg:      '#F5F0EA',
  surface: '#EBE5DE',
  sr:      '#E0D9D1',
  sh:      '#D5CEC5',
  border:  '#C2BAB0',
  text:    '#1A1512',
  t2:      '#685E55',
  t3:      '#9E9488',
} as const;

// Colores fijos — no cambian con el tema
export const fixed = {
  accent:    '#C4783A',
  accentAlt: { blue: '#3A8AB8', green: '#5B9A6A', rose: '#B8445A' },
  star:      '#E8C05A',
  error:     '#C43A3A',
  warning:   '#C49A20',
  success:   '#5CAF7E',
  status: {
    reading:   '#4A96B8',
    read:      '#5CAF7E',
    want:      '#8A6CD8',
    abandoned: '#787068',
  },
} as const;

export type AppColors = typeof rawDark & typeof fixed;

// Hook — devuelve colores del tema activo + colores fijos
export function useColors(): AppColors {
  const scheme = useColorScheme() ?? 'light';
  const raw = scheme === 'dark' ? rawDark : rawLight;
  return { ...raw, ...fixed } as AppColors;
}
