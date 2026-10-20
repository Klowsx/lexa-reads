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
  embedded?: boolean
}

export function ProfileStats({
  books,
  reviews,
  followers,
  following,
  onPressBooks,
  onPressReviews,
  onPressFollowers,
  onPressFollowing,
  embedded = false
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
    <View
      className={
        embedded
          ? 'border-t border-border flex-row flex-wrap px-2 py-3'
          : 'mx-container mb-8 border-y border-border flex-row flex-wrap py-2'
      }
    >
      {stats.map(({ label, value, onPress }) => (
        <Pressable
          key={label}
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : 'text'}
          accessibilityLabel={value.toLocaleString(i18n.language) + ' ' + label}
          className="items-center justify-center py-3 rounded-sm gap-1 active:bg-sr"
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
