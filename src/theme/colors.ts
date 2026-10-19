// Este archivo se genera desde src/theme/tokens.json. No editar manualmente.
import { useColorScheme } from 'react-native';

// Valores para StyleSheet.create() o cuando no hay acceso a clases NativeWind.
export const rawDark = {
  "bg": "#100D0A",
  "surface": "#1C1815",
  "sr": "#252118",
  "sh": "#2D2922",
  "border": "#35302B",
  "text": "#F0EAE2",
  "t2": "#9E9488",
  "t3": "#6A635C"
} as const;

export const rawLight = {
  "bg": "#F5F0EA",
  "surface": "#EBE5DE",
  "sr": "#E0D9D1",
  "sh": "#D5CEC5",
  "border": "#C2BAB0",
  "text": "#1A1512",
  "t2": "#685E55",
  "t3": "#9E9488"
} as const;

// Colores semánticos que no cambian entre tema claro y oscuro.
export const fixed = {
  "accent": "#C4783A",
  "accentAlt": {
    "blue": "#3A8AB8",
    "green": "#5B9A6A",
    "rose": "#B8445A"
  },
  "star": "#E8C05A",
  "error": "#C43A3A",
  "warning": "#C49A20",
  "success": "#5CAF7E",
  "onAccent": "#FFFFFF",
  "status": {
    "reading": "#4A96B8",
    "read": "#5CAF7E",
    "want": "#8A6CD8",
    "abandoned": "#787068"
  },
  "avatar": {
    "profile": [
      "#C4783A",
      "#4A96B8",
      "#5B9A6A",
      "#B8445A",
      "#8A6CD8",
      "#C49A20"
    ],
    "derived": [
      "#C4783A",
      "#4A96B8",
      "#5CAF7E",
      "#8A6CD8",
      "#B8445A",
      "#C49A20",
      "#3A8AB8",
      "#7E5CAF"
    ]
  }
} as const;

export type AppColors = typeof rawDark & typeof fixed;

// Devuelve la paleta del tema activo junto con los colores semánticos fijos.
export function useColors(): AppColors {
  const scheme = useColorScheme() ?? 'light';
  const raw = scheme === 'dark' ? rawDark : rawLight;
  return { ...raw, ...fixed } as AppColors;
}

// Convierte un hexadecimal en rgba para usar transparencias sin duplicar colores.
export function alpha(hex: string, opacity: number): string {
  const numericColor = Number.parseInt(hex.replace('#', ''), 16);
  return 'rgba(' + (numericColor >> 16) + ',' + ((numericColor >> 8) & 255) + ',' + (numericColor & 255) + ',' + opacity + ')';
}
