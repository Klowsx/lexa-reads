import { Text, View } from 'react-native'
import { useColors } from '~/theme/colors'

const BOOKS = [
  { title: 'Una habitación propia', author: 'Virginia Woolf', tilt: '-8deg' },
  { title: 'El jardín secreto', author: 'Frances H. Burnett', tilt: '5deg' }
] as const

// Presenta cubiertas tipográficas propias de dos obras reales, sin imágenes remotas.
export function BookFan() {
  const c = useColors()
  return (
    <View
      className="items-center justify-center py-8"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ width: 272, height: 222 }}>
        {BOOKS.map((book, index) => (
          <View
            key={book.title}
            style={{
              position: 'absolute',
              left: index * 114 + 7,
              top: index * 17,
              width: 144,
              height: 198,
              borderRadius: 5,
              backgroundColor: index === 0 ? c.text : c.sr,
              padding: 18,
              transform: [{ rotate: book.tilt }]
            }}
          >
            <Text
              style={{ color: index === 0 ? c.bg : c.text }}
              className="font-body text-[12px]"
            >
              {book.author}
            </Text>
            <View className="flex-1" />
            <Text
              style={{ color: index === 0 ? c.bg : c.text }}
              className="font-display text-[24px] leading-7"
            >
              {book.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
