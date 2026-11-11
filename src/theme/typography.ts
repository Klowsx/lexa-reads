export const fonts = {
  serif: 'Newsreader',
  sans: 'Inter'
} as const

// Use for StyleSheet / inline styles
export const fontFamily = {
  serif: 'Newsreader_400Regular',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifSemiBold: 'Newsreader_600SemiBold',
  serifBold: 'Newsreader_700Bold',
  sans: 'Inter_400Regular',
  sansLight: 'Inter_300Light',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold'
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 22,
  xl: 28,
  '2xl': 32,
  '3xl': 36
} as const

export const lineHeight = {
  tight: 1.2,
  normal: 1.45,
  relaxed: 1.65
} as const

export const letterSpacing = {
  tight: -0.02,
  normal: 0,
  wide: 0.05,
  wider: 0.1,
  widest: 0.16
} as const
