import { Text, View } from 'react-native'
import { deriveAvatarColor, extractInitials } from '~/lib/utils'

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`
}

interface Props {
  // Acepta tanto usuarios de DB como cualquier objeto con username/display_name.
  user: {
    id?: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
  }
  size?: number
}

// Versión del Avatar que funciona con usuarios reales de la base de datos.
// Deriva las iniciales y el color de forma determinista a partir del username,
// así el mismo usuario siempre muestra el mismo color sin necesidad de almacenarlo.
export function UserAvatar({ user, size = 34 }: Props) {
  const name = user.display_name ?? user.username
  const initials = extractInitials(name)
  const color = deriveAvatarColor(user.id ?? user.username)

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: alpha(color, 0.18),
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <Text className="font-body-sb" style={{ fontSize: size * 0.33, color }}>
        {initials}
      </Text>
    </View>
  )
}
