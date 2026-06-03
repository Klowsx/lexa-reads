import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import type { LibraryRow } from '~/features/library/library.queries';

interface Props {
  books: LibraryRow[];
  onViewAll?: () => void;
}

export function RecentReads({ books, onViewAll }: Props) {
  const router = useRouter();

  if (books.length === 0) return null;

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
        {books.map((row) => {
          if (!row.books) return null;
          return (
            <Pressable
              key={row.id}
              onPress={() =>
                router.push({
                  pathname: '/book/[id]',
                  params: { id: row.books!.id },
                })
              }
            >
              <BookCover book={row.books} width={72} height={108} />
              {row.rating != null && (
                <View className="mt-1.5">
                  <StarRating rating={row.rating} size={9} />
                </View>
              )}
            </Pressable>
          );
        })}

        {onViewAll && (
          <Pressable
            onPress={onViewAll}
            className="w-12 items-center justify-center gap-1 opacity-70"
          >
            <Text className="text-t3 text-[24px] leading-[26px]">›</Text>
            <Text className="text-xs font-body text-t3 text-center">Ver todo</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
