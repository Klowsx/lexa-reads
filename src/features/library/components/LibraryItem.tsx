import { Pressable, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import { StarRating } from '~/components/ui/StarRating'
import type { LibraryRow } from '../library.queries'

interface Props {
  item: LibraryRow
  itemWidth: number
  onPress: () => void
}

// Presenta una lectura con ancho adaptable y una sola acción accesible para abrir su registro.
export function LibraryItem({ item, itemWidth, onPress }: Props) {
  const book = item.books

  // Si el JOIN no devolvió el libro (no debería pasar, pero lo manejamos)
  if (!book) return null

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[book.title, book.authors?.join(', ')]
        .filter(Boolean)
        .join(', ')}
      className="mb-5 min-h-12 rounded-md px-2 hover:bg-surface active:opacity-70 focus-visible:outline focus-visible:outline-accent"
      style={{ width: itemWidth + 16 }}
    >
      <BookCover
        book={book}
        width={itemWidth}
        height={Math.round(itemWidth * 1.52)}
      />
      <View className="mt-2" style={{ width: itemWidth }}>
        <Text
          className="font-body-md text-xs text-text leading-tight"
          numberOfLines={2}
        >
          {book.title}
        </Text>
        <Text className="mt-1 font-body text-xs text-t2" numberOfLines={1}>
          {book.authors?.join(', ')}
        </Text>
        {item.rating != null && (
          <View className="mt-1">
            <StarRating rating={item.rating} size={12} />
          </View>
        )}
      </View>
    </Pressable>
  )
}
