import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useBookCoverModeration } from '../hooks/useBookCoverModeration'
import { pickBookCover } from '../pick-cover'

// Permite que moderación reemplace la única portada compartida de la ficha.
export function BookCoverModeration({ bookId }: { bookId: string }) {
  const { t } = useTranslation()
  const { canModerate, replace } = useBookCoverModeration(bookId)
  const [error, setError] = useState('')

  // Selecciona una imagen validada y deja la corrección de catálogo al hook.
  async function changeCover() {
    try {
      const image = await pickBookCover()
      if (!image?.base64) return
      await replace.mutateAsync(image.base64)
      setError('')
    } catch (cause) {
      setError(
        t(
          cause instanceof Error && cause.message === 'cover-too-large'
            ? 'createBook.coverTooLarge'
            : 'createBook.saveError'
        )
      )
    }
  }

  if (!canModerate) return null
  return (
    <View className="gap-2 px-container py-3">
      <Pressable
        onPress={changeCover}
        disabled={replace.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: replace.isPending }}
        className="min-h-12 justify-center self-start rounded-md bg-surface px-4"
      >
        <Text className="font-body-sb text-xs text-text">
          {t('book.correctCover')}
        </Text>
      </Pressable>
      {!!error && (
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-xs text-error"
        >
          {error}
        </Text>
      )}
    </View>
  )
}
