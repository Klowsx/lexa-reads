import { AppHeader } from '~/components/AppHeader'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { BookOpen, Search, X } from 'lucide-react-native'
import { BookReadingSheet } from '~/features/book/components/BookReadingSheet'
import { LibraryItem } from '../components/LibraryItem'
import { LibrarySkeleton } from '../components/LibrarySkeleton'
import { LibraryTabs } from '../components/LibraryTabs'
import { useLibraryPages, useLibrarySummary } from '../hooks/useLibrary'
import type { LibraryFilters } from '../library.queries'
import { ErrorState } from '~/components/ui/ErrorState'
import { useDebounce } from '~/lib/useDebounce'
import { type BookStatus } from '~/lib/book-status'
import { useColors } from '~/theme/colors'
import { cn } from '~/lib/utils'
import type { Tables } from '~/types/database'

// Filtra en el servidor y muestra páginas sin bloquear la edición compartida de cada libro.
export default function LibraryScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { t } = useTranslation()
  const colors = useColors()
  const { width } = useWindowDimensions()
  const contentWidth = Math.min(width, 960)
  const columns = contentWidth < 600 ? 2 : contentWidth < 840 ? 3 : 4
  const itemWidth = Math.floor((contentWidth - 36) / columns) - 16
  const [activeTab, setActiveTab] = useState<BookStatus>('reading')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 350)
  const [rating, setRating] = useState<LibraryFilters['rating']>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<Tables<'books'> | null>(null)
  const summary = useLibrarySummary()
  const counts = { reading: 0, read: 0, want_to_read: 0, abandoned: 0 }
  for (const row of summary.data ?? []) counts[row.status] = row.total
  const tags = summary.data?.find((row) => row.status === activeTab)?.tags ?? []
  const filters = {
    status: activeTab,
    search: debouncedSearch,
    rating,
    tag: selectedTag
  }
  const query = useLibraryPages(filters)
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const filtered = !!search.trim() || rating !== 'all' || selectedTag !== null
  const searching = search.trim() !== debouncedSearch
  const listKey = JSON.stringify([
    activeTab,
    debouncedSearch,
    rating,
    selectedTag,
    columns
  ])

  // Cambia de estantería sin conservar una etiqueta que podría no existir en ella.
  function changeTab(status: BookStatus) {
    setActiveTab(status)
    setSelectedTag(null)
  }

  // Quita los filtros secundarios y conserva el estado de lectura seleccionado.
  function clearFilters() {
    setSearch('')
    setRating('all')
    setSelectedTag(null)
  }

  // Evita peticiones solapadas; los fallos se reintentan desde la acción explícita del pie.
  function loadMore() {
    if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError)
      void query.fetchNextPage()
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <AppHeader />
      <View className="w-full max-w-[960px] flex-1 self-center">
        <View className="px-container pt-3">
          <Text
            accessibilityRole="header"
            className="font-display-sb text-xl text-text mb-4"
          >
            {t('library.title')}
          </Text>
          <View className="mt-4 min-h-12 flex-row items-center rounded-md border border-border bg-surface pl-3">
            <Search size={20} color={colors.t2} accessible={false} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              maxLength={120}
              placeholder={t('library.searchPlaceholder')}
              accessibilityLabel={t('library.searchPlaceholder')}
              placeholderTextColor={colors.t2}
              autoCorrect={false}
              returnKeyType="search"
              className="min-h-12 min-w-0 flex-1 rounded-md px-3 font-body text-base text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
            {search.length > 0 && (
              <Pressable
                onPress={() => setSearch('')}
                accessibilityRole="button"
                accessibilityLabel={t('library.clearSearch')}
                className="h-12 w-12 items-center justify-center rounded-md hover:bg-sr focus-visible:outline focus-visible:outline-accent"
              >
                <X size={20} color={colors.text} />
              </Pressable>
            )}
          </View>
          <View className="mt-4">
            <LibraryTabs
              activeTab={activeTab}
              countByStatus={summary.data ? counts : undefined}
              onTabChange={changeTab}
            />
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingVertical: 12,
            gap: 8
          }}
        >
          {(['all', 'rated', 'unrated'] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setRating(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: rating === value }}
              className={cn(
                'min-h-12 justify-center rounded-full border px-4 hover:bg-sh active:opacity-70 focus-visible:outline focus-visible:outline-accent',
                rating === value ? 'border-text bg-sr' : 'border-border bg-bg'
              )}
            >
              <Text
                className={cn(
                  'text-xs text-text',
                  rating === value ? 'font-body-sb' : 'font-body'
                )}
              >
                {t(`library.rating.${value}`)}
              </Text>
            </Pressable>
          ))}
          {tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
              accessibilityRole="button"
              accessibilityLabel={t('library.filterByTag', { tag })}
              accessibilityState={{ selected: selectedTag === tag }}
              className={cn(
                'min-h-12 justify-center rounded-full border px-4 hover:bg-sh active:opacity-70 focus-visible:outline focus-visible:outline-accent',
                selectedTag === tag
                  ? 'border-text bg-sr'
                  : 'border-border bg-bg'
              )}
            >
              <Text className="font-body text-xs text-text">{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {summary.isError && (
          <View className="px-container pb-2">
            <Text className="font-body text-xs text-t2">
              {t('library.summaryError')}
            </Text>
            <Pressable
              onPress={() => void summary.refetch()}
              accessibilityRole="button"
              className="min-h-12 justify-center"
            >
              <Text className="font-body-sb text-xs text-text">
                {t('common.retry')}
              </Text>
            </Pressable>
          </View>
        )}
        <View className="px-container pb-3 flex-row items-center justify-between gap-2">
          <Text className="font-body text-xs text-t2">
            {t('library.recentFirst')}
          </Text>
          {filtered && (
            <Pressable
              onPress={clearFilters}
              accessibilityRole="button"
              className="min-h-12 justify-center rounded-md px-2 hover:bg-surface focus-visible:outline focus-visible:outline-accent"
            >
              <Text className="font-body-sb text-xs text-text">
                {t('library.clearFilters')}
              </Text>
            </Pressable>
          )}
        </View>
        {query.isRefetchError && (
          <Pressable
            onPress={() => void query.refetch()}
            accessibilityRole="button"
            className="mx-container mb-2 min-h-12 justify-center rounded-md bg-sr px-3 focus-visible:outline focus-visible:outline-accent"
          >
            <Text
              accessibilityRole="alert"
              className="font-body text-xs text-text"
            >
              {t('library.refreshError')}
            </Text>
          </Pressable>
        )}
        {query.isPending || searching ? (
          <LibrarySkeleton itemWidth={itemWidth} columns={columns} />
        ) : query.isError && !query.data ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : (
          <FlashList
            key={listKey}
            data={items}
            numColumns={columns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 96 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onEndReached={loadMore}
            onEndReachedThreshold={0.35}
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            renderItem={({ item }) => (
              <LibraryItem
                item={item}
                itemWidth={itemWidth}
                onPress={() => item.books && setSelectedBook(item.books)}
              />
            )}
            ListEmptyComponent={
              <View className="items-center px-6 py-10 gap-3">
                <BookOpen size={32} color={colors.t2} accessible={false} />
                <Text className="font-display-sb text-lg text-text text-center">
                  {t(
                    filtered
                      ? 'library.noMatches'
                      : `library.emptyTitle.${activeTab}`
                  )}
                </Text>
                <Text className="font-body text-sm text-t2 text-center max-w-sm">
                  {t(
                    filtered
                      ? 'library.noMatchesHint'
                      : `library.emptyHint.${activeTab}`
                  )}
                </Text>
                <Pressable
                  onPress={
                    filtered
                      ? clearFilters
                      : () => router.navigate('/(tabs)/search')
                  }
                  accessibilityRole="button"
                  className="mt-2 min-h-12 justify-center rounded-md bg-sr px-5 py-3 hover:bg-sh focus-visible:outline focus-visible:outline-accent"
                >
                  <Text className="font-body-sb text-xs text-text">
                    {t(
                      filtered ? 'library.clearFilters' : 'library.searchBooks'
                    )}
                  </Text>
                </Pressable>
              </View>
            }
            ListFooterComponent={
              items.length > 0 ? (
                <View className="items-center gap-2 py-6">
                  {query.isFetchingNextPage ? (
                    <>
                      <ActivityIndicator color={colors.text} />
                      <Text
                        accessibilityLiveRegion="polite"
                        className="font-body text-xs text-t2"
                      >
                        {t('library.loadingMore')}
                      </Text>
                    </>
                  ) : query.isFetchNextPageError ? (
                    <>
                      <Text
                        accessibilityRole="alert"
                        className="font-body text-xs text-t2 text-center"
                      >
                        {t('library.moreError')}
                      </Text>
                      <Pressable
                        onPress={() => void query.fetchNextPage()}
                        accessibilityRole="button"
                        className="min-h-12 rounded-md bg-sr justify-center px-5"
                      >
                        <Text className="font-body-sb text-xs text-text">
                          {t('common.retry')}
                        </Text>
                      </Pressable>
                    </>
                  ) : query.hasNextPage ? (
                    <Pressable
                      onPress={loadMore}
                      accessibilityRole="button"
                      className="min-h-12 rounded-md bg-sr justify-center px-5"
                    >
                      <Text className="font-body-sb text-xs text-text">
                        {t('library.loadMore')}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text className="font-body text-xs text-t2">
                      {t('library.endOfShelf', { count: items.length })}
                    </Text>
                  )}
                </View>
              ) : null
            }
          />
        )}
      </View>
      {selectedBook && (
        <BookReadingSheet
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </View>
  )
}
