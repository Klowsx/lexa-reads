import { useColors } from '~/theme/colors'
import { fontFamily } from '~/theme/typography'

// Adapta los nombres usados por las superficies Stitch al único tema y registro de fuentes de la app.
export function useStitchTheme() {
  const c = useColors()
  return {
    background: c.bg,
    surface: c.surface,
    muted: c.sr,
    text: c.text,
    secondary: c.t2,
    border: c.border,
    primary: c.accent,
    onPrimary: c.onAccent,
    error: c.error,
    body: fontFamily.sans,
    label: fontFamily.sansSemiBold,
    heading: fontFamily.serifSemiBold
  }
}
