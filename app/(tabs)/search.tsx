import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { BookCard } from '~/features/book/components/BookCard';
import { GenreChips } from '~/features/book/components/GenreChips';
import { QuickPeekSheet } from '~/features/book/components/QuickPeekSheet';
import { SearchBar } from '~/features/book/components/SearchBar';
import { useSearchBooks } from '~/features/book/hooks/useSearchBook';
import { useTrendingBooks } from '~/features/book/hooks/useTrendingBooks';
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
  const { data: trending, isLoading: isTrendingLoading } = useTrendingBooks();
  const trendingBooks = trending?.books ?? [];
  const trendingSource = trending?.source;
  const [infoVisible, setInfoVisible] = useState(false);

  const listData = query.length > 2 ? results : trendingBooks;

  const discoverLabel =
    trendingSource === 'community' ? 'En Lexa ahora' : 'Populares esta semana';

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
        data={listData}
        keyExtractor={(item) => item.google_books_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 72 }}
        ListHeaderComponent={
          <View className="mb-3">
            {!query && <GenreChips />}
            <View className="flex-row items-center gap-1.5 mb-2.5">
              <Text
                className="text-xs text-t3 tracking-widest"
                style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
              >
                {!query
                  ? discoverLabel
                  : isLoading
                    ? 'Buscando...'
                    : `${results.length} resultado${results.length !== 1 ? 's' : ''} · "${query}"`}
              </Text>
              {!query && trendingSource === 'bestsellers' && (
                <Pressable
                  onPress={() => setInfoVisible(true)}
                  hitSlop={8}
                  className="w-4 h-4 rounded-full border border-t3 items-center justify-center"
                >
                  <Text className="text-t3" style={{ fontSize: 9, fontFamily: 'DMSans_600SemiBold', lineHeight: 12 }}>i</Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          (isLoading && query.length > 2) || (isTrendingLoading && !query)
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

      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setInfoVisible(false)}
        >
          <Pressable
            className="bg-surface rounded-t-xl px-6 pt-6 pb-10 gap-3"
            onPress={() => {}}
          >
            <Text className="font-display-sb text-lg text-text">
              ¿Por qué los títulos están en inglés?
            </Text>
            <Text className="font-body text-sm text-t2 leading-5">
              La lista "Populares esta semana" usa los bestsellers de The New York Times, que registra los libros con su título original en inglés.
            </Text>
            <Text className="font-body text-sm text-t2 leading-5">
              La mayoría tienen traducción al español — búscalos por su título en español en la barra de búsqueda para encontrar la edición en tu idioma.
            </Text>
            <Text className="font-body-md text-xs text-t3 mt-1">
              Cuando más lectores usen Lexa, esta lista pasará a mostrar lo que la propia comunidad está leyendo.
            </Text>
            <Pressable
              onPress={() => setInfoVisible(false)}
              className="mt-2 bg-accent rounded-lg py-3 items-center"
            >
              <Text className="font-body-sb text-sm text-white">Entendido</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
