import { useTranslation } from 'react-i18next'
import { Pressable, Text, View, useWindowDimensions } from 'react-native'

interface Props {
  books: number
  reviews: number
  followers: number
  following: number
  onPressBooks?: () => void
  onPressReviews?: () => void
  onPressFollowers?: () => void
  onPressFollowing?: () => void
}

// Presenta contadores legibles y solo habilita las rutas disponibles para el acceso actual.
export function ProfileStats({
  books,
  reviews,
  followers,
  following,
  onPressBooks,
  onPressReviews,
  onPressFollowers,
  onPressFollowing
}: Props) {
  const { t, i18n } = useTranslation()
  const { width, fontScale } = useWindowDimensions()
  const columns = Math.min(width, 720) / fontScale < 390 ? 2 : 4
  const stats = [
    { label: t('profile.statBooks'), value: books, onPress: onPressBooks },
    {
      label: t('profile.statReviews'),
      value: reviews,
      onPress: onPressReviews
    },
    {
      label: t('profile.statFollowers'),
      value: followers,
      onPress: onPressFollowers
    },
    {
      label: t('profile.statFollowing'),
      value: following,
      onPress: onPressFollowing
    }
  ]

  return (
    <View className="mx-container mb-6 bg-surface rounded-card flex-row flex-wrap py-2">
      {stats.map(({ label, value, onPress }) => (
        <Pressable
          key={label}
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : 'text'}
          accessibilityLabel={value.toLocaleString(i18n.language) + ' ' + label}
          className="min-h-12 items-center justify-center py-3 rounded-sm gap-1 active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          style={{ width: `${100 / columns}%` }}
        >
          <Text
            className="font-body-sb text-md text-text"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {Intl.NumberFormat(i18n.language, {
              notation: value >= 10000 ? 'compact' : 'standard',
              maximumFractionDigits: 1
            }).format(value)}
          </Text>
          <Text className="font-body text-xs text-t2 text-center">{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}
