import type { Tables } from '~/types'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { fixed } from '~/theme/colors'
import { bookCoverTokens } from '~/theme/media'

interface BookCoverProps {
  book: Pick<Tables<'books'>, 'id' | 'title' | 'cover_url'> &
    Partial<Pick<Tables<'books'>, 'google_books_id'>>
  width?: number
  height?: number
}

// Asigna una cubierta estable usando la paleta del design system.
function colorFromId(id: string): string {
  const palette = fixed.cover.backgrounds
  let hash = 0
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

// Conserva la portada tipográfica durante la carga, si falta la imagen o si falla su descarga.
export function BookCover({ book, width = 60, height = 90 }: BookCoverProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const fontSize = Math.max(
    bookCoverTokens.minTitleSize,
    Math.min(bookCoverTokens.maxTitleSize, height * bookCoverTokens.titleRatio)
  )
  const style = {
    width,
    height,
    borderRadius: bookCoverTokens.radius,
    flexShrink: 0
  }
  return (
    <View
      accessible
      accessibilityLabel={book.title}
      style={{
        ...style,
        backgroundColor: colorFromId(book.google_books_id ?? book.id),
        overflow: 'hidden'
      }}
    >
      <View className="flex-1 justify-end p-2">
        <Text
          className="font-display"
          style={{
            fontSize,
            color: fixed.cover.ink,
            lineHeight: fontSize * bookCoverTokens.titleLineHeight
          }}
          numberOfLines={4}
        >
          {book.title}
        </Text>
      </View>
      {book.cover_url && failedUrl !== book.cover_url && (
        <Image
          source={{ uri: book.cover_url }}
          style={[StyleSheet.absoluteFillObject, { width, height }]}
          contentFit="cover"
          accessible={false}
          recyclingKey={book.cover_url}
          onError={() => setFailedUrl(book.cover_url)}
        />
      )}
    </View>
  )
}
