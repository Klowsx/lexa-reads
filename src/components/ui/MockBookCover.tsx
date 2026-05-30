import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import type { MockBook } from '~/mock';

interface Props {
  book: MockBook;
  width?: number;
  height?: number;
}

export function MockBookCover({ book, width = 62, height = 93 }: Props) {
  const fontSize = Math.max(6, Math.min(9, height * 0.078));
  const title = book.title.length > 22 ? book.title.slice(0, 20) + '…' : book.title;
  const c2Dim = book.c2 + '44';

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 5,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.55,
        shadowRadius: 6,
        shadowOffset: { width: 2, height: 4 },
        elevation: 8,
        borderWidth: 1,
        borderColor: c2Dim,
      }}
    >
      <LinearGradient
        colors={[book.c1, c2Dim]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View style={{ height: 3, backgroundColor: book.c2 }} />
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 5 }}>
          <Text
            style={{
              fontSize,
              color: 'rgba(240,234,226,0.82)',
              fontFamily: 'PlayfairDisplay_400Regular',
              lineHeight: fontSize * 1.2,
            }}
            numberOfLines={4}
          >
            {title}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
