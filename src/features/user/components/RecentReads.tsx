import { Pressable, ScrollView, Text, View } from 'react-native';
import { MockBookCover } from '~/components/ui/MockBookCover';
import { StarRating } from '~/components/ui/StarRating';
import type { MockBook, MockUserBook } from '~/mock';
import { useColors } from '~/theme/colors';

interface Props {
  books: MockUserBook[];
  onPress: (book: MockBook) => void;
}

export function RecentReads({ books, onPress }: Props) {
  const c = useColors();

  return (
    <View className="mb-5">
      <Text className="font-body-sb text-xs text-t3 tracking-widest uppercase mb-2.5 px-4">
        Leídos recientemente
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 2 }}
      >
        {books.map(({ book, rating }) => (
          <Pressable key={book.id} onPress={() => onPress(book)}>
            <MockBookCover book={book} width={72} height={108} />
            {rating != null && (
              <View className="mt-1.5">
                <StarRating rating={rating} size={9} />
              </View>
            )}
          </Pressable>
        ))}

        <Pressable className="w-12 items-center justify-center gap-1 opacity-70">
          <Text className="text-t3" style={{ fontSize: 24, lineHeight: 26 }}>›</Text>
          <Text className="text-xs font-body text-t3 text-center">Ver todo</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
