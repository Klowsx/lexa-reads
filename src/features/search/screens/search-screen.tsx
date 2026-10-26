import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { ScanLine } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookCard } from '~/features/book/components/BookCard'
import {
  emptyCatalogFilters,
  type CatalogFilters
} from '~/features/book/catalog.queries'
import { BookReadingSheet } from '~/features/book/components/BookReadingSheet'
import { SearchBar } from '~/features/book/components/SearchBar'
import { useCatalogBooks } from '~/features/book/hooks/useCatalogBooks'
import { useTrendingBooks } from '~/features/book/hooks/useTrendingBooks'
import {
  SearchAction,
  SearchTabs,
  type SearchTab
} from '~/features/search/components/SearchControls'
import {
  SearchFeedback,
  SearchLoading
} from '~/features/search/components/SearchFeedback'
import { CatalogFilterSheet } from '~/features/search/components/CatalogFilterSheet'
import { UserCard } from '~/features/user/components/UserCard'
import { useSearchUsers } from '~/features/user/hooks/useSearchUsers'
import type { SearchUser } from '~/features/user/user.queries'
import { useDebounce } from '~/lib/useDebounce'
import { useColors } from '~/theme/colors'
import type { Tables } from '~/types/database'
import { isIsbn13, normalizeIsbn13 } from '~/features/book/isbn'

type Item =
  { kind: 'book'; value: Tables<'books'> } | { kind: 'user'; value: SearchUser }

// Da prioridad a los libros y combina el texto con los filtros del catálogo.
export default function SearchScreen() {
  const router = useRouter()
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const c = useColors()
  const [tab, setTab] = useState<SearchTab>('books')
  const [query, setQuery] = useState(initialQuery ?? '')
  const [searchFocused, setSearchFocused] = useState(false)
  const [filters, setFilters] =
    useState<Omit<CatalogFilters, 'search'>>(emptyCatalogFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const [quickPeekBook, setQuickPeekBook] = useState<Tables<'books'> | null>(
    null
  )
  const trimmed = query.trim()
  const isbn13 = isIsbn13(trimmed) ? normalizeIsbn13(trimmed) : null
  const debounced = useDebounce(trimmed, 350)
  const waiting = !!trimmed && trimmed !== debounced
  const activeFilters =
    filters.genres.length +
    filters.tags.length +
    Number(!!filters.yearFrom || !!filters.yearTo)
  const discover = !trimmed && activeFilters === 0
  const catalog = useCatalogBooks(
    {
      search: debounced,
      ...filters
    },
    tab === 'books' && !discover && !waiting
  )
  const trending = useTrendingBooks()
  const users = useSearchUsers(
    tab === 'users' ? debounced.replace(/^@/, '') : ''
  )
  const books = discover
    ? (trending.data?.books ?? [])
    : (catalog.data?.pages.flatMap((page) => page.items) ?? [])
  const readers = users.data ?? []
  const source = tab === 'books' ? (discover ? trending : catalog) : users
  const items: Item[] = waiting
    ? []
    : tab === 'books'
      ? books.map((value) => ({ kind: 'book', value }))
      : readers.map((value) => ({ kind: 'user', value }))

  // Abre la ficha a partir del identificador estable de Lexa.
  function openBook(book: Tables<'books'>) {
    Keyboard.dismiss()
    router.push({ pathname: '/book/[id]', params: { id: book.id } })
  }

  // Lleva el ISBN no encontrado al alta para evitar que el lector vuelva a escribirlo.
  function openBookCreation() {
    router.push({
      pathname: '/book/create',
      params: isbn13 ? { isbn: isbn13 } : { title: trimmed }
    })
  }

  // Abre la cámara para completar la búsqueda a partir del código ISBN del libro.
  function openIsbnScanner() {
    Keyboard.dismiss()
    router.push('/book/scan-isbn')
  }

  // Muestra una fila con acciones separadas para libro y lector.
  function renderItem({ item }: { item: Item }) {
    return item.kind === 'book' ? (
      <BookCard
        book={item.value}
        onPress={() => openBook(item.value)}
        onQuickPeek={() => setQuickPeekBook(item.value)}
      />
    ) : (
      <UserCard user={item.value} />
    )
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="w-full max-w-3xl flex-1 self-center">
        <View className="gap-3 px-container pb-3 pt-4">
          <Text
            accessibilityRole="header"
            className="font-display-sb text-xl text-text"
          >
            {t('search.title')}
          </Text>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onFocusChange={setSearchFocused}
            placeholder={t(
              tab === 'books'
                ? 'book.searchPlaceholder'
                : 'search.readersPlaceholder'
            )}
          />
          {tab === 'books' &&
            searchFocused &&
            trimmed &&
            !waiting &&
            books.length > 0 && (
              <View className="rounded-md border border-border bg-surface p-2">
                <Text className="px-2 py-1 font-body-sb text-xs text-t2">
                  {t('search.quickMatches')}
                </Text>
                {books.slice(0, 4).map((book) => (
                  <Pressable
                    key={book.id}
                    onPress={() => openBook(book)}
                    accessibilityRole="button"
                    accessibilityLabel={t('search.openBook', {
                      title: book.title
                    })}
                    className="min-h-12 justify-center rounded-md px-2 active:bg-sr"
                  >
                    <Text
                      numberOfLines={1}
                      className="font-body-sb text-xs text-text"
                    >
                      {book.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-body text-xs text-t2"
                    >
                      {book.authors?.join(', ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          <SearchTabs active={tab} onChange={setTab} />
          {tab === 'books' && (
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={openIsbnScanner}
                accessibilityRole="button"
                accessibilityLabel={t('search.scanIsbn')}
                className="size-11 items-center justify-center rounded-md bg-surface active:bg-sr"
              >
                <ScanLine size={20} color={c.accent} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss()
                  setFilterOpen(true)
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  activeFilters
                    ? `${t('search.filters')}: ${activeFilters}`
                    : t('search.filters')
                }
                className={
                  activeFilters
                    ? 'min-h-11 justify-center rounded-md bg-sr px-4'
                    : 'min-h-11 justify-center rounded-md bg-surface px-4'
                }
              >
                <Text
                  className={
                    activeFilters
                      ? 'font-body-sb text-xs text-accent'
                      : 'font-body-sb text-xs text-text'
                  }
                >
                  {t('search.filters')}
                  {activeFilters ? ` · ${activeFilters}` : ''}
                </Text>
              </Pressable>
              {activeFilters > 0 && (
                <Pressable
                  onPress={() => setFilters(emptyCatalogFilters)}
                  accessibilityRole="button"
                  className="min-h-11 justify-center px-2"
                >
                  <Text className="font-body-sb text-xs text-accent">
                    {t('search.clearFilters')}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          {tab === 'books' && (
            <SearchAction
              label={t('search.addBook')}
              onPress={openBookCreation}
            />
          )}
        </View>
        <FlashList<Item>
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.kind + item.value.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 32 }}
          ListHeaderComponent={
            items.length > 0 ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mb-4 font-body text-xs text-t2"
              >
                {tab === 'books'
                  ? t(discover ? 'search.inLexaNow' : 'search.booksLoaded', {
                      count: books.length
                    })
                  : t('search.usersCount', { count: readers.length })}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            waiting || source.isLoading ? (
              <SearchLoading readers={tab === 'users'} />
            ) : source.isError ? (
              <SearchFeedback
                title={t('search.loadError')}
                message={t('search.loadErrorHint')}
                action={t('common.retry')}
                onAction={() => {
                  void source.refetch()
                }}
              />
            ) : (
              <SearchFeedback
                title={t(
                  isbn13
                    ? 'search.isbnNotFound'
                    : tab === 'books'
                      ? 'search.discoveryEmpty'
                      : 'search.noReaders'
                )}
                message={t(
                  isbn13
                    ? 'search.isbnNotFoundHint'
                    : tab === 'books'
                      ? 'search.addBookHint'
                      : 'search.noReadersHint'
                )}
                action={
                  tab === 'books'
                    ? t(isbn13 ? 'search.addBookWithIsbn' : 'search.addBook')
                    : undefined
                }
                onAction={tab === 'books' ? openBookCreation : undefined}
              />
            )
          }
          ListFooterComponent={
            tab === 'books' && items.length > 0 && !waiting ? (
              <View className="gap-3 pb-6">
                {catalog.isFetchNextPageError && (
                  <SearchAction
                    label={t('common.retry')}
                    onPress={() => {
                      void catalog.fetchNextPage()
                    }}
                  />
                )}
                {!discover &&
                  catalog.hasNextPage &&
                  !catalog.isFetchNextPageError && (
                    <SearchAction
                      label={t('search.loadMore')}
                      disabled={catalog.isFetchingNextPage}
                      onPress={() => {
                        void catalog.fetchNextPage()
                      }}
                    />
                  )}
              </View>
            ) : null
          }
        />
      </View>
      {quickPeekBook && (
        <BookReadingSheet
          book={quickPeekBook}
          onClose={() => setQuickPeekBook(null)}
          showSynopsis={false}
        />
      )}
      {filterOpen && (
        <CatalogFilterSheet
          value={filters}
          onApply={(next) => {
            setFilters(next)
            setFilterOpen(false)
          }}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </View>
  )
}
