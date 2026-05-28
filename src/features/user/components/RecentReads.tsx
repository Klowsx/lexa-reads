import { Pressable, ScrollView, Text, View } from 'react-native';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import type { MockBook, MockUserBook } from '~/mock';

interface Props {
  books: MockUserBook[];
  onPress: (book: MockBook) => void;
}

export function RecentReads({ books, onPress }: Props) {
  return (
    <View className="mb-5">
      <Text
        className="font-body-sb text-xs text-t3 tracking-widest mb-2.5 px-4"
        style={{ textTransform: 'uppercase' }}
      >
        Leídos recientemente
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {books.map(({ book, rating }) => (
          <Pressable key={book.id} onPress={() => onPress(book)}>
            <BookCover book={book} width={62} height={93} />
            {rating != null && (
              <View className="mt-1">
                <StarRating rating={rating} size={8} />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
