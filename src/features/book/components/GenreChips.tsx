import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, View } from 'react-native'

export const SEARCH_GENRES = [
  'fantasy',
  'mystery',
  'romance',
  'fiction',
  'memoir',
  'magic'
] as const
export type SearchGenre = (typeof SEARCH_GENRES)[number]

// Ofrece accesos reales a géneros sin desplazar las primeras recomendaciones.
export function GenreChips({
  onSelect
}: {
  onSelect: (genre: SearchGenre) => void
}) {
  const { t } = useTranslation()
  return (
    <View className="mb-6 gap-3">
      <Text
        accessibilityRole="header"
        className="font-body-sb text-xs text-text"
      >
        {t('search.exploreGenres')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row gap-2 pr-1">
          {SEARCH_GENRES.map((genre) => (
            <Pressable
              key={genre}
              accessibilityRole="button"
              accessibilityLabel={t('search.exploreGenre', {
                genre: t('search.genres.' + genre)
              })}
              onPress={() => onSelect(genre)}
              className="min-h-12 justify-center rounded-full bg-surface px-4 py-3 hover:bg-sr active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Text className="font-body-md text-xs text-text">
                {t('search.genres.' + genre)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
