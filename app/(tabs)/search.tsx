import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, LayoutChangeEvent, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { BookCard } from '~/features/book/components/BookCard';
import { GenreChips } from '~/features/book/components/GenreChips';
import { QuickPeekSheet } from '~/features/book/components/QuickPeekSheet';
import { SearchBar } from '~/features/book/components/SearchBar';
import { UserCard } from '~/features/user/components/UserCard';
import { useSearchBooks } from '~/features/book/hooks/useSearchBook';
import { useTrendingBooks } from '~/features/book/hooks/useTrendingBooks';
import { useColors } from '~/theme/colors';
import { useDebounce } from '~/lib/useDebounce';
import { FULL_USERS } from '~/mock';
import type { Tables } from '~/types/database';

// ─── Segmented control ────────────────────────────────────────

type SearchTab = 'all' | 'books' | 'users';

const TABS: { id: SearchTab; label: string }[] = [
  { id: 'all',   label: 'Todo'     },
  { id: 'books', label: 'Libros'   },
  { id: 'users', label: 'Usuarios' },
];

interface SegmentedControlProps {
  active: SearchTab;
  onChange: (tab: SearchTab) => void;
}

function SegmentedControl({ active, onChange }: SegmentedControlProps) {
  const c = useColors();
  const [containerWidth, setContainerWidth] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;

  const activeIndex = TABS.findIndex((t) => t.id === active);
  const segW = containerWidth / TABS.length;

  useEffect(() => {
    if (!containerWidth) return;
    Animated.spring(slideX, {
      toValue: activeIndex * segW,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    }).start();
  }, [activeIndex, segW]);

  function onLayout(e: LayoutChangeEvent) {
    setContainerWidth(e.nativeEvent.layout.width);
  }

  return (
    <View
      onLayout={onLayout}
      className="flex-row rounded-md mx-4 mb-3 relative overflow-hidden"
      style={{
        backgroundColor: c.sh,
        borderWidth: 1,
        borderColor: c.border,
        height: 34,
      }}
    >
      {/* Sliding pill */}
      {containerWidth > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            width: segW - 6,
            left: 3,
            backgroundColor: c.accent,
            borderRadius: 6,
            transform: [{ translateX: slideX }],
          }}
        />
      )}
      {TABS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            className="flex-1 items-center justify-center"
          >
            <Text
              className="text-xs font-body-sb"
              style={{ color: isActive ? '#fff' : c.t2 }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [quickPeekBook, setQuickPeekBook] = useState<Tables<'books'> | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const debouncedQuery = useDebounce(query, 400);
  const { data: results = [], isLoading } = useSearchBooks(debouncedQuery);
  const { data: trending, isLoading: isTrendingLoading } = useTrendingBooks();
  const trendingBooks = trending?.books ?? [];
  const trendingSource = trending?.source;

  const discoverLabel =
    trendingSource === 'community' ? 'En Lexa ahora' : 'Populares esta semana';

  // Filter users by query
  const filteredUsers = debouncedQuery.length > 1
    ? FULL_USERS.filter(
        (u) =>
          u.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : FULL_USERS.slice(0, 3);

  const bookData = debouncedQuery.length > 2 ? results : trendingBooks;

  // ── Render for "Usuarios" tab ──────────────────────────────
  if (activeTab === 'users') {
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
        <SegmentedControl active={activeTab} onChange={setActiveTab} />

        {filteredUsers.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 gap-2">
            <Text className="text-xs font-body text-t3 text-center">
              Sin resultados para "{debouncedQuery}"
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 72 }}
          >
            {!debouncedQuery && (
              <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1 mt-1">
                Sugeridos
              </Text>
            )}
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // ── Render for "Todo" tab (mixed) ──────────────────────────
  if (activeTab === 'all') {
    const showingSearch = debouncedQuery.length > 2;

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
        <SegmentedControl active={activeTab} onChange={setActiveTab} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 72 }}
        >
          {/* Genres — only when not searching */}
          {!showingSearch && (
            <View className="px-4 mb-2">
              <GenreChips />
            </View>
          )}

          {/* Books section */}
          <View className="px-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Text
                className="text-xs text-t3 tracking-widest flex-1"
                style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
              >
                {showingSearch
                  ? isLoading ? 'Buscando...' : `${results.length} libro${results.length !== 1 ? 's' : ''}`
                  : discoverLabel}
              </Text>
              {!showingSearch && trendingSource === 'bestsellers' && (
                <Pressable
                  onPress={() => setInfoVisible(true)}
                  hitSlop={8}
                  className="w-4 h-4 rounded-full border border-t3 items-center justify-center"
                >
                  <Text className="text-t3" style={{ fontSize: 9, fontFamily: 'DMSans_600SemiBold', lineHeight: 12 }}>i</Text>
                </Pressable>
              )}
            </View>

            {(isLoading && debouncedQuery.length > 2) || (isTrendingLoading && !query) ? (
              <ActivityIndicator color={c.accent} className="my-4" />
            ) : (
              bookData.map((item) => (
                <BookCard
                  key={item.google_books_id}
                  book={item}
                  onPress={() => router.push(`/book/${item.google_books_id}`)}
                  onQuickPeek={() => setQuickPeekBook(item)}
                />
              ))
            )}
          </View>

          {/* Users section — always visible, filtered when searching */}
          <View className="px-4 mt-3">
            <Text
              className="text-xs text-t3 tracking-widest mb-2"
              style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
            >
              {showingSearch
                ? `${filteredUsers.length} usuario${filteredUsers.length !== 1 ? 's' : ''}`
                : 'Lectores sugeridos'}
            </Text>

            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </View>
        </ScrollView>

        {quickPeekBook && (
          <QuickPeekSheet
            book={quickPeekBook}
            onClose={() => setQuickPeekBook(null)}
          />
        )}

        <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
          <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setInfoVisible(false)}>
            <Pressable className="bg-surface rounded-t-xl px-6 pt-6 pb-10 gap-3" onPress={() => {}}>
              <Text className="font-display-sb text-lg text-text">¿Por qué los títulos están en inglés?</Text>
              <Text className="font-body text-sm text-t2 leading-5">
                La lista "Populares esta semana" usa los bestsellers de The New York Times, que registra los libros con su título original en inglés.
              </Text>
              <Text className="font-body text-sm text-t2 leading-5">
                La mayoría tienen traducción al español — búscalos por su título en español en la barra de búsqueda para encontrar la edición en tu idioma.
              </Text>
              <Text className="font-body-md text-xs text-t3 mt-1">
                Cuando más lectores usen Lexa, esta lista pasará a mostrar lo que la propia comunidad está leyendo.
              </Text>
              <Pressable onPress={() => setInfoVisible(false)} className="mt-2 bg-accent rounded-lg py-3 items-center">
                <Text className="font-body-sb text-sm text-white">Entendido</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // ── "Libros" tab — original full book list ─────────────────
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
      <SegmentedControl active={activeTab} onChange={setActiveTab} />

      <FlashList
        data={bookData}
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
          (isLoading && debouncedQuery.length > 2) || (isTrendingLoading && !query)
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

      <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setInfoVisible(false)}>
          <Pressable className="bg-surface rounded-t-xl px-6 pt-6 pb-10 gap-3" onPress={() => {}}>
            <Text className="font-display-sb text-lg text-text">¿Por qué los títulos están en inglés?</Text>
            <Text className="font-body text-sm text-t2 leading-5">
              La lista "Populares esta semana" usa los bestsellers de The New York Times, que registra los libros con su título original en inglés.
            </Text>
            <Text className="font-body text-sm text-t2 leading-5">
              La mayoría tienen traducción al español — búscalos por su título en español en la barra de búsqueda para encontrar la edición en tu idioma.
            </Text>
            <Text className="font-body-md text-xs text-t3 mt-1">
              Cuando más lectores usen Lexa, esta lista pasará a mostrar lo que la propia comunidad está leyendo.
            </Text>
            <Pressable onPress={() => setInfoVisible(false)} className="mt-2 bg-accent rounded-lg py-3 items-center">
              <Text className="font-body-sb text-sm text-white">Entendido</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
