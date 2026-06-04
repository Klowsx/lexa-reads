import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useSearchUsers } from '~/features/user/hooks/useSearchUsers';
import { cn } from '~/lib/utils';
import { useColors } from '~/theme/colors';
import { useDebounce } from '~/lib/useDebounce';
import type { Tables } from '~/types/database';

// ─── NYT info modal ───────────────────────────────────────────

function NytInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable className="bg-surface rounded-t-xl px-6 pt-6 pb-10 gap-3" onPress={() => {}}>
          <Text className="font-display-sb text-lg text-text">{t('search.nytTitle')}</Text>
          <Text className="font-body text-sm text-t2 leading-5">
            {t('search.nytBody1')}
          </Text>
          <Text className="font-body text-sm text-t2 leading-5">
            {t('search.nytBody2')}
          </Text>
          <Text className="font-body-md text-xs text-t3 mt-1">
            {t('search.nytBody3')}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.gotIt')}
            className="mt-2 bg-accent rounded-lg py-3 items-center"
          >
            <Text className="font-body-sb text-sm text-white">{t('common.gotIt')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Segmented control ────────────────────────────────────────

type SearchTab = 'all' | 'books' | 'users';

const TABS: { id: SearchTab; labelKey: string }[] = [
  { id: 'all',   labelKey: 'search.tabAll'   },
  { id: 'books', labelKey: 'search.tabBooks' },
  { id: 'users', labelKey: 'search.tabUsers' },
];

interface SegmentedControlProps {
  active: SearchTab;
  onChange: (tab: SearchTab) => void;
}

function SegmentedControl({ active, onChange }: SegmentedControlProps) {
  const c = useColors();
  const { t } = useTranslation();
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
      className="flex-row rounded-md mx-4 mb-3 relative overflow-hidden h-[34px] border border-border bg-sh"
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
      {TABS.map(({ id, labelKey }) => {
        const isActive = active === id;
        const label = t(labelKey);
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
            className="flex-1 items-center justify-center"
          >
            <Text
              className={cn("text-xs font-body-sb", isActive ? "text-white" : "text-t2")}
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
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [quickPeekBook, setQuickPeekBook] = useState<Tables<'books'> | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  function handleTabChange(tab: SearchTab) {
    setActiveTab(tab);
    setInfoVisible(false);
  }

  const debouncedQuery = useDebounce(query, 400);
  const { data: results = [], isLoading } = useSearchBooks(debouncedQuery);
  const { data: trending, isLoading: isTrendingLoading } = useTrendingBooks();
  const { data: userResults = [], isLoading: isUsersLoading } = useSearchUsers(debouncedQuery);
  const trendingBooks = trending?.books ?? [];
  const trendingSource = trending?.source;

  const discoverLabel =
    trendingSource === 'community' ? t('search.inLexaNow') : t('search.popularThisWeek');

  const bookData = debouncedQuery.length > 2 ? results : trendingBooks;
  const showingSearch = debouncedQuery.length > 2;

  // ── Render for "Usuarios" tab ──────────────────────────────
  if (activeTab === 'users') {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-2.5 pb-3">
          <Text className="font-display-sb text-xl text-text tracking-tight mb-3">{t('search.title')}</Text>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
        <SegmentedControl active={activeTab} onChange={handleTabChange} />

        {isUsersLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={c.accent} />
          </View>
        ) : userResults.length === 0 && showingSearch ? (
          <View className="flex-1 items-center justify-center px-8 gap-2">
            <Text className="text-xs font-body text-t3 text-center">
              {t('search.noResultsFor', { query: debouncedQuery })}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 72 }}
          >
            {!showingSearch && (
              <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1 mt-1">
                {t('search.suggested')}
              </Text>
            )}
            {userResults.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // ── Render for "Todo" tab (mixed) ──────────────────────────
  if (activeTab === 'all') {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-2.5 pb-3">
          <Text className="font-display-sb text-xl text-text tracking-tight mb-3">{t('search.title')}</Text>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
        <SegmentedControl active={activeTab} onChange={handleTabChange} />

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
                className="text-xs text-t3 tracking-widest flex-1 font-body-sb uppercase"
              >
                {showingSearch
                  ? isLoading ? t('search.searching') : t('search.booksCount', { count: results.length })
                  : discoverLabel}
              </Text>
              {!showingSearch && trendingSource === 'bestsellers' && (
                <Pressable
                  onPress={() => setInfoVisible(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('search.moreInfo')}
                  className="w-4 h-4 rounded-full border border-t3 items-center justify-center"
                >
                  <Text className="text-t3 text-[9px] font-body-sb leading-[12px]">i</Text>
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

          {/* Users section */}
          <View className="px-4 mt-3">
            <Text
              className="text-xs text-t3 tracking-widest mb-2 font-body-sb uppercase"
            >
              {showingSearch
                ? t('search.usersCount', { count: userResults.length })
                : t('search.suggestedReaders')}
            </Text>

            {isUsersLoading ? (
              <ActivityIndicator color={c.accent} className="my-2" />
            ) : (
              userResults.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </View>
        </ScrollView>

        {quickPeekBook && (
          <QuickPeekSheet
            book={quickPeekBook}
            onClose={() => setQuickPeekBook(null)}
          />
        )}

        <NytInfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
      </View>
    );
  }

  // ── "Libros" tab — original full book list ─────────────────
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-2.5 pb-3">
        <Text className="font-display-sb text-xl text-text tracking-tight mb-3">{t('search.title')}</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          focused={focused}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      <SegmentedControl active={activeTab} onChange={handleTabChange} />

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
                className="text-xs text-t3 tracking-widest font-body-sb uppercase"
              >
                {!query
                  ? discoverLabel
                  : isLoading
                    ? t('search.searching')
                    : t('search.resultsFor', { count: results.length, query })}
              </Text>
              {!query && trendingSource === 'bestsellers' && (
                <Pressable
                  onPress={() => setInfoVisible(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('search.moreInfo')}
                  className="w-4 h-4 rounded-full border border-t3 items-center justify-center"
                >
                  <Text className="text-t3 text-[9px] font-body-sb leading-[12px]">i</Text>
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

      <NytInfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </View>
  );
}
