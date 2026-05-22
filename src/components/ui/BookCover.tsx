import { Text, View } from 'react-native';
import type { MockBook } from '~/mock';

interface BookCoverProps {
  book: MockBook;
  width?: number;
  height?: number;
}

export function BookCover({ book, width = 60, height = 90 }: BookCoverProps) {
  const fontSize = Math.max(6, Math.min(9, height * 0.078));
  const title = book.title.length > 22 ? book.title.slice(0, 20) + '…' : book.title;

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 5,
        backgroundColor: book.c1,
        borderWidth: 1,
        borderColor: book.c2 + '44',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.55,
        shadowRadius: 6,
        elevation: 8,
      }}
    >
      <View style={{ height: 3, backgroundColor: book.c2 }} />
      <View className="flex-1 justify-end p-1">
        <Text
          style={{
            fontSize,
            color: 'rgba(240,234,226,0.82)',
            fontFamily: 'PlayfairDisplay_400Regular',
            lineHeight: fontSize * 1.25,
          }}
          numberOfLines={3}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
