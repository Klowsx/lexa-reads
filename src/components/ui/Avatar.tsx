import { Image } from 'expo-image'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { getAvatarColor, getInitials } from '~/lib/avatar'
import { alpha, useColors } from '~/theme/colors'

interface AvatarProps {
  displayName: string
  username: string
  avatarUrl?: string | null
  size?: number
  neutral?: boolean
}

// Usa una foto o iniciales del sistema, con un tono neutro opcional para listas de búsqueda.
export function Avatar({
  displayName,
  username,
  avatarUrl,
  size = 34,
  neutral = false
}: AvatarProps) {
  const c = useColors()
  const color = getAvatarColor(username)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  if (avatarUrl && avatarUrl !== failedUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          flexShrink: 0
        }}
        contentFit="cover"
        recyclingKey={avatarUrl}
        accessibilityLabel={displayName}
        onError={() => setFailedUrl(avatarUrl)}
      />
    )
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: neutral ? c.sr : alpha(color, 0.18),
        borderWidth: neutral ? 0 : 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <Text
        className="font-body-sb"
        style={{ fontSize: size * 0.33, color: neutral ? c.text : color }}
      >
        {getInitials(displayName)}
      </Text>
    </View>
  )
}
