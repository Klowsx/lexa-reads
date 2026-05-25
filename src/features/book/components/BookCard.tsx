import { BookMarked } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { BookCover } from '~/components/ui/BookCover';
import { useColors } from '~/theme/colors';
import type { Tables } from '~/types/database';

interface Props {
  book: Tables<'books'>;
  onPress: () => void;
  onQuickPeek: () => void;
}

export function BookCard({ book, onPress, onQuickPeek }: Props) {
  const c = useColors();

  return (
    <View className="flex-row bg-surface rounded-md border border-border mb-2.5 overflow-hidden">
      <Pressable
        onPress={onPress}
        className="flex-row gap-3 p-3 flex-1 min-w-0"
      >
        <BookCover book={book} width={44} height={66} />
        <View className="flex-1 min-w-0">
          <Text
            className="font-display-sb text-sm text-text leading-tight mb-0.5"
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <Text className="font-body text-sm text-t2 mb-1.5" numberOfLines={1}>
            {book.authors?.join(', ')}
          </Text>
          {book.page_count ? (
            <Text className="font-body text-xs text-t3">{book.page_count} páginas</Text>
          ) : null}
          <View className="flex-row gap-1 flex-wrap mt-1">
            {book.genres?.slice(0, 2).map((g) => (
              <Text
                key={g}
                className="text-xs font-body text-t3 px-1.5 py-0.5 bg-sh rounded-sm"
              >
                {g}
              </Text>
            ))}
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onQuickPeek}
        hitSlop={8}
        className="justify-center px-3"
      >
        <BookMarked size={16} color={c.t3} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}
