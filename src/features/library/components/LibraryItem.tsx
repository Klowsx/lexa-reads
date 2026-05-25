import { Pressable, Text, View } from 'react-native';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import type { MockUserBook } from '~/mock';

interface Props {
  item: MockUserBook;
  itemWidth: number;
  onPress: () => void;
}

export function LibraryItem({ item, itemWidth, onPress }: Props) {
  return (
    <Pressable onPress={onPress} className="mb-3.5 px-1">
      <BookCover book={item.book} width={itemWidth} height={Math.round(itemWidth * 1.52)} />
      <View className="mt-1.5">
        <Text className="font-display text-xs text-text leading-tight" numberOfLines={2}>
          {item.book.title}
        </Text>
        {item.rating != null && (
          <View className="mt-1">
            <StarRating rating={item.rating} size={9} />
          </View>
        )}
      </View>
    </Pressable>
  );
}
