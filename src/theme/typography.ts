export const fonts = {
  serif: 'PlayfairDisplay',
  sans:  'DMSans',
} as const;

// Use for StyleSheet / inline styles
export const fontFamily = {
  serif:        'PlayfairDisplay_400Regular',
  serifItalic:  'PlayfairDisplay_400Regular_Italic',
  serifSemiBold:'PlayfairDisplay_600SemiBold',
  serifBold:    'PlayfairDisplay_700Bold',
  sans:         'DMSans_400Regular',
  sansLight:    'DMSans_300Light',
  sansMedium:   'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
} as const;

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   22,
  '2xl':28,
  '3xl':34,
} as const;

export const lineHeight = {
  tight:  1.2,
  normal: 1.45,
  relaxed:1.65,
} as const;

export const letterSpacing = {
  tight:  -0.02,
  normal:  0,
  wide:    0.05,
  wider:   0.10,
  widest:  0.16,
} as const;
