import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular'
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold'
import { Newsreader_600SemiBold } from '@expo-google-fonts/newsreader/600SemiBold'
import { useFonts } from 'expo-font'
import { useThemeStore } from '~/stores/theme.store'

// Tokens de Stitch para las superficies nuevas; el tema existente conserva sus consumidores.
export const stitch = {
  light: {
    background: '#fff8f5',
    surface: '#ffffff',
    muted: '#f6ece6',
    text: '#1f1b17',
    secondary: '#45464d',
    border: '#c6c6cd',
    primary: '#000000',
    onPrimary: '#ffffff',
    error: '#ba1a1a'
  },
  dark: {
    background: '#121316',
    surface: '#1a1c22',
    muted: '#23252e',
    text: '#f8fafc',
    secondary: '#b6bfcd',
    border: '#454855',
    primary: '#f8fafc',
    onPrimary: '#121316',
    error: '#ffb4ab'
  },
  radius: 12,
  spacing: 16
} as const

// Carga Newsreader e Inter solo al entrar en una superficie nueva y respeta el tema elegido.
export function useStitchTheme() {
  const scheme = useThemeStore((state) => state.scheme)
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Newsreader_600SemiBold
  })
  return {
    ...stitch[scheme],
    body: loaded ? 'Inter_400Regular' : undefined,
    label: loaded ? 'Inter_600SemiBold' : undefined,
    heading: loaded ? 'Newsreader_600SemiBold' : undefined
  }
}
