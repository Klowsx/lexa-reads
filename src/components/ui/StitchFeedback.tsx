import { AlertCircle, BookOpen, Lock } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { useStitchTheme } from '~/theme/stitch'
import { StitchButton } from './StitchButton'

// Distingue los estados nuevos de error, vacío y acceso restringido sin ocultar cómo continuar.
export function StitchFeedback({
  title,
  message,
  kind = 'empty',
  action,
  busy = false
}: {
  title: string
  message: string
  kind?: 'error' | 'empty' | 'private'
  action?: { label: string; onPress: () => void }
  busy?: boolean
}) {
  const c = useStitchTheme()
  const Icon =
    kind === 'error' ? AlertCircle : kind === 'private' ? Lock : BookOpen
  return (
    <View style={{ padding: 20, gap: 12, backgroundColor: c.background }}>
      <Icon
        size={28}
        color={kind === 'error' ? c.error : c.secondary}
        accessible={false}
      />
      <Text
        accessibilityRole={kind === 'error' ? 'alert' : 'header'}
        style={{
          fontFamily: c.heading,
          fontSize: 24,
          lineHeight: 30,
          color: c.text
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: c.body,
          fontSize: 16,
          lineHeight: 24,
          color: c.secondary
        }}
      >
        {message}
      </Text>
      {action && (
        <StitchButton
          label={action.label}
          onPress={action.onPress}
          loading={busy}
          secondary
        />
      )}
    </View>
  )
}
