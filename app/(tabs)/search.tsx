import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { BookCard } from '~/features/book/components/BookCard';
import { GenreChips } from '~/features/book/components/GenreChips';
import { QuickPeekSheet } from '~/features/book/components/QuickPeekSheet';
import { SearchBar } from '~/features/book/components/SearchBar';
import { useSearchBooks } from '~/features/book/hooks/useSearchBook';
import { useColors } from '~/theme/colors';
import { useDebounce } from '~/lib/useDebounce';
import type { Tables } from '~/types/database';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [quickPeekBook, setQuickPeekBook] = useState<Tables<'books'> | null>(null);

  const debouncedQuery = useDebounce(query, 400);
  const { data: results = [], isLoading } = useSearchBooks(debouncedQuery);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-2.5 pb-3">
        <Text className="font-display-sb text-xl text-text tracking-tight mb-3">Buscar</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          focused={focused}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>

      <FlashList
        data={results}
        keyExtractor={(item) => item.google_books_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 72 }}
        ListHeaderComponent={
          <View className="mb-3">
            {!query && <GenreChips />}
            <Text
              className="text-xs text-t3 mb-2.5 tracking-widest"
              style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
            >
              {!query
                ? 'Descubrir'
                : isLoading
                  ? 'Buscando...'
                  : `${results.length} resultado${results.length !== 1 ? 's' : ''} · "${query}"`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading && query.length > 2
            ? <ActivityIndicator color={c.accent} className="mt-8" />
            : null
        }
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => router.push(`/book/${item.google_books_id}`)}
            onQuickPeek={() => setQuickPeekBook(item)}
          />
        )}
      />

      {quickPeekBook && (
        <QuickPeekSheet
          book={quickPeekBook}
          onClose={() => setQuickPeekBook(null)}
        />
      )}
    </View>
  );
}
