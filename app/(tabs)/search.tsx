import { useRouter } from 'expo-router'
import { Info } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Animated,
  Easing,
  Keyboard,
  SectionList,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookCard } from '~/features/book/components/BookCard'
import {
  GenreChips,
  type SearchGenre
} from '~/features/book/components/GenreChips'
import { BookReadingSheet } from '~/features/book/components/BookReadingSheet'
import { SearchBar } from '~/features/book/components/SearchBar'
import { useSearchBooks } from '~/features/book/hooks/useSearchBook'
import { useTrendingBooks } from '~/features/book/hooks/useTrendingBooks'
import {
  SearchAction,
  SearchIconButton,
  SearchTabs,
  type SearchTab
} from '~/features/search/components/SearchControls'
import {
  SearchFeedback,
  SearchLoading
} from '~/features/search/components/SearchFeedback'
import { BottomSheet } from '~/components/ui/BottomSheet'
import { UserCard } from '~/features/user/components/UserCard'
import { useSearchUsers } from '~/features/user/hooks/useSearchUsers'
import type { SearchUser } from '~/features/user/user.queries'
import { useDebounce } from '~/lib/useDebounce'
import { useColors } from '~/theme/colors'
import type { Tables } from '~/types/database'

type SearchItem =
  { kind: 'book'; value: Tables<'books'> } | { kind: 'user'; value: SearchUser }
type SearchSection = {
  key: 'books' | 'users'
  title: string
  data: SearchItem[]
  loading: boolean
  error: boolean
  total: number
  retry: () => void
}

const GENRE_SUBJECTS: Record<SearchGenre, string> = {
  fantasy: 'Fantasy',
  mystery: 'Mystery',
  romance: 'Romance',
  fiction: 'Science Fiction',
  memoir: 'Memoir',
  magic: 'Magical Realism'
}

// Reúne descubrimiento, libros y lectores en una sola lista con estados coherentes.
export default function SearchScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<SearchGenre | null>(null)
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const [quickPeekBook, setQuickPeekBook] = useState<Tables<'books'> | null>(
    null
  )
  const [infoVisible, setInfoVisible] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [floatingHeaderVisible, setFloatingHeaderVisible] = useState(false)
  const headerOffset = useRef(new Animated.Value(0)).current
  const headerOpacity = useRef(new Animated.Value(0)).current
  const previousScrollY = useRef(0)
  const directionDistance = useRef(0)
  const lastDirection = useRef<'up' | 'down' | 'none'>('none')
  const reduceMotion = useReducedMotion()

  // Muestra la barra fija al subir y la oculta al bajar.
  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const currentY = Math.max(0, event.nativeEvent.contentOffset.y)
    const difference = currentY - previousScrollY.current
    previousScrollY.current = currentY
    if (currentY <= 1) {
      directionDistance.current = 0
      lastDirection.current = 'none'
      setFloatingHeaderVisible(false)
      return
    }
    if (Math.abs(difference) < 0.5) return

    const direction = difference > 0 ? 'down' : 'up'
    if (direction !== lastDirection.current) {
      directionDistance.current = 0
      lastDirection.current = direction
    }
    directionDistance.current += Math.abs(difference)

    if (directionDistance.current >= 10) {
      setFloatingHeaderVisible(direction === 'up')
      directionDistance.current = 0
    }
  }

  // Anima la barra fija y respeta la preferencia de movimiento reducido.
  useEffect(() => {
    const duration = reduceMotion ? 0 : 180
    const animation = Animated.parallel([
      Animated.timing(headerOffset, {
        toValue: floatingHeaderVisible ? 0 : -headerHeight,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(headerOpacity, {
        toValue: floatingHeaderVisible ? 1 : 0,
        duration,
        useNativeDriver: true
      })
    ])
    animation.start()
    return () => animation.stop()
  }, [
    floatingHeaderVisible,
    headerHeight,
    headerOffset,
    headerOpacity,
    reduceMotion
  ])

  const trimmedQuery = query.trim()
  const debouncedQuery = useDebounce(trimmedQuery, 400)
  const showingSearch = trimmedQuery.length >= 3
  const tooShort = trimmedQuery.length > 0 && !showingSearch
  const waiting = showingSearch && trimmedQuery !== debouncedQuery
  const bookTerm = genre
    ? 'subject:"' + GENRE_SUBJECTS[genre] + '"'
    : debouncedQuery
  const books = useSearchBooks(showingSearch ? bookTerm : '')
  const trending = useTrendingBooks()
  const users = useSearchUsers(
    showingSearch ? debouncedQuery.replace(/^@/, '') : ''
  )
  const bookQuery = showingSearch ? books : trending
  const bookData = showingSearch
    ? (books.data ?? [])
    : (trending.data?.books ?? [])
  const userData = users.data ?? []
  const discoverLabel =
    trending.data?.source === 'community'
      ? t('search.inLexaNow')
      : t('search.popularThisWeek')
  const sections: SearchSection[] = []

  if (!tooShort && activeTab !== 'users') {
    sections.push({
      key: 'books',
      title: showingSearch ? t('search.tabBooks') : discoverLabel,
      data:
        waiting || bookQuery.isLoading
          ? []
          : (activeTab === 'all' ? bookData.slice(0, 3) : bookData).map(
              (value) => ({ kind: 'book', value })
            ),
      loading: waiting || bookQuery.isLoading,
      error: bookQuery.isError,
      total: bookData.length,
      retry: () => {
        void bookQuery.refetch()
      }
    })
  }
  if (!tooShort && activeTab !== 'books') {
    sections.push({
      key: 'users',
      title: showingSearch
        ? t('search.tabUsers')
        : t('search.suggestedReaders'),
      data:
        waiting || users.isLoading
          ? []
          : (activeTab === 'all' ? userData.slice(0, 3) : userData).map(
              (value) => ({ kind: 'user', value })
            ),
      loading: waiting || users.isLoading,
      error: users.isError,
      total: userData.length,
      retry: () => {
        void users.refetch()
      }
    })
  }

  // Una edición manual deja de aplicar el género y vuelve a la búsqueda libre.
  function changeQuery(value: string) {
    setGenre(null)
    setQuery(value)
  }

  // Busca por categoría del catálogo y muestra un nombre legible en el campo.
  function selectGenre(value: SearchGenre) {
    Keyboard.dismiss()
    setGenre(value)
    setQuery(t('search.genres.' + value))
    setActiveTab('books')
  }

  // Conserva el texto al cambiar de alcance y cierra ayudas que ya no aplican.
  function changeTab(value: SearchTab) {
    setActiveTab(value)
    setInfoVisible(false)
    if (value === 'users') setGenre(null)
  }

  // Abre la hoja rápida después de liberar el espacio ocupado por el teclado.
  function openQuickPeek(book: Tables<'books'>) {
    Keyboard.dismiss()
    setQuickPeekBook(book)
  }

  // Separa las acciones del libro y del lector sin anidar controles interactivos.
  function renderResult({ item }: { item: SearchItem }) {
    return item.kind === 'book' ? (
      <BookCard
        book={item.value}
        onPress={() => router.push('/book/' + item.value.google_books_id)}
        onQuickPeek={() => openQuickPeek(item.value)}
      />
    ) : (
      <UserCard user={item.value} />
    )
  }

  // Mantiene el título visible también cuando una sección no devuelve resultados.
  function renderSectionHeader({ section }: { section: SearchSection }) {
    return (
      <View className="mb-3 flex-row items-center gap-2">
        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className="font-display-sb text-md text-text"
          >
            {section.title}
          </Text>
          {showingSearch && !section.loading && !section.error && (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-1 font-body text-xs text-t2"
            >
              {t(
                section.key === 'books'
                  ? 'search.booksCount'
                  : 'search.usersCount',
                { count: section.total }
              )}
            </Text>
          )}
        </View>
        {!showingSearch &&
          section.key === 'books' &&
          trending.data?.source === 'bestsellers' && (
            <SearchIconButton
              label={t('search.moreInfo')}
              onPress={() => setInfoVisible(true)}
            >
              <Info size={20} color={c.t2} />
            </SearchIconButton>
          )}
      </View>
    )
  }

  // Cada fuente puede fallar o cargar de forma independiente sin ocultar la otra.
  function renderSectionFooter({ section }: { section: SearchSection }) {
    if (section.loading)
      return <SearchLoading readers={section.key === 'users'} />
    if (section.error)
      return (
        <SearchFeedback
          title={t('search.loadError')}
          message={t('search.loadErrorHint')}
          action={t('common.retry')}
          onAction={section.retry}
        />
      )
    if (section.total === 0)
      return (
        <SearchFeedback
          title={t(
            showingSearch ? 'search.noResultsFor' : 'search.discoveryEmpty',
            { query: trimmedQuery }
          )}
          message={t(
            showingSearch
              ? section.key === 'books'
                ? 'search.noBooksHint'
                : 'search.noReadersHint'
              : 'search.discoveryEmptyHint'
          )}
          action={showingSearch ? t('search.clear') : undefined}
          onAction={() => changeQuery('')}
        />
      )
    return (
      <View className="mb-8">
        {activeTab === 'all' && section.total > 3 && (
          <SearchAction
            label={t(
              section.key === 'books' ? 'search.seeBooks' : 'search.seeReaders'
            )}
            onPress={() => changeTab(section.key)}
          />
        )}
      </View>
    )
  }

  const searchHeader = (
    <View className="gap-3 px-container pb-5 pt-4">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="font-display-sb text-xl tracking-tight text-text"
        >
          {t('search.title')}
        </Text>
        <Text className="font-body text-xs text-t2">
          {t('search.subtitle')}
        </Text>
      </View>
      <SearchBar
        value={query}
        onChangeText={changeQuery}
        placeholder={t(
          activeTab === 'users'
            ? 'search.readersPlaceholder'
            : activeTab === 'books'
              ? 'book.searchPlaceholder'
              : 'search.placeholder'
        )}
      />
      <SearchTabs active={activeTab} onChange={changeTab} />
    </View>
  )

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="w-full max-w-3xl flex-1 self-center">
        <Animated.View
          pointerEvents={floatingHeaderVisible ? 'auto' : 'none'}
          accessibilityElementsHidden={!floatingHeaderVisible}
          importantForAccessibility={
            floatingHeaderVisible ? 'auto' : 'no-hide-descendants'
          }
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            backgroundColor: c.bg,
            transform: [{ translateY: headerOffset }],
            opacity: headerOpacity
          }}
        >
          {searchHeader}
        </Animated.View>
        <View className="flex-1 px-container">
          <SectionList<SearchItem, SearchSection>
            key={activeTab + (showingSearch ? ':search' : ':discover')}
            sections={sections}
            keyExtractor={(item) => item.kind + ':' + item.value.id}
            renderItem={renderResult}
            renderSectionHeader={renderSectionHeader}
            renderSectionFooter={renderSectionFooter}
            stickySectionHeadersEnabled={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListHeaderComponent={
              <View>
                <View
                  onLayout={(event) =>
                    setHeaderHeight(event.nativeEvent.layout.height)
                  }
                  accessibilityElementsHidden={floatingHeaderVisible}
                  importantForAccessibility={
                    floatingHeaderVisible ? 'no-hide-descendants' : 'auto'
                  }
                >
                  {searchHeader}
                </View>
                {tooShort ? (
                  <SearchFeedback
                    title={t('search.keepTyping')}
                    message={t('search.minimumQuery')}
                  />
                ) : !trimmedQuery && activeTab !== 'users' ? (
                  <GenreChips onSelect={selectGenre} />
                ) : null}
              </View>
            }
          />
        </View>
      </View>
      {quickPeekBook && (
        <BookReadingSheet
          book={quickPeekBook}
          onClose={() => setQuickPeekBook(null)}
          showSynopsis={false}
        />
      )}
      {infoVisible && (
        <BottomSheet
          title={t('search.nytTitle')}
          onClose={() => setInfoVisible(false)}
        >
          <Text className="font-body text-xs text-text">
            {t('search.nytBody1')}
          </Text>
          <Text className="font-body text-xs text-t2">
            {t('search.nytBody2')}
          </Text>
          <Text className="font-body text-xs text-t2">
            {t('search.nytBody3')}
          </Text>
          <SearchAction
            label={t('common.gotIt')}
            onPress={() => setInfoVisible(false)}
          />
        </BottomSheet>
      )}
    </View>
  )
}
