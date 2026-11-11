import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  TextInput,
  RefreshControl
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Heart, Lock, Globe, Trash2, Plus, Check, X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookCover } from '~/components/ui/BookCover'
import { ErrorState } from '~/components/ui/ErrorState'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { BookReadingSheet } from '~/features/book/components/BookReadingSheet'
import { useSearchBooks } from '~/features/book/hooks/useSearchBook'
import { useDebounce } from '~/lib/useDebounce'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import type { Tables } from '~/types'
import { useList } from '../hooks/useList'
import { useDeleteList } from '../hooks/useDeleteList'
import { useRemoveBookFromList } from '../hooks/useRemoveBookFromList'
import { useAddBookToList } from '../hooks/useAddBookToList'
import { useToggleListLike } from '../hooks/useToggleListLike'
import { ListAction, ListHeader, ListLoading } from '../components/ListControls'
import type { ListBookItem } from '../list.queries'

// Presenta la colección y permite buscar y añadir libros sin perder el contexto de la lista.
export default function ListDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>(),
    router = useRouter(),
    { t } = useTranslation(),
    c = useColors(),
    insets = useSafeAreaInsets()
  const uid = useAuthStore((s) => s.user?.id),
    query = useList(slug ?? ''),
    list = query.data
  const owner = !!list && list.user_id === uid
  const [searching, setSearching] = useState(false),
    [text, setText] = useState('')
  const term = useDebounce(text.trim(), 350)
  const search = useSearchBooks(searching && owner ? term : '')
  const add = useAddBookToList(),
    remove = useRemoveBookFromList(slug),
    del = useDeleteList()
  const [removeItem, setRemoveItem] = useState<ListBookItem | null>(null),
    [deleteOpen, setDeleteOpen] = useState(false),
    [selected, setSelected] = useState<Tables<'books'> | null>(null)
  const like = useToggleListLike(
    list?.id ?? '',
    list?.liked ?? false,
    list?.likes_count ?? 0
  )
  const [addedTitle, setAddedTitle] = useState('')
  const membership = new Set(list?.items.map((i) => i.book.id) ?? [])
  const busy = add.isPending || remove.isPending || del.isPending
  // Añade una edición persistida; el contador y la portada vuelven del servidor.
  function addBook(book: Tables<'books'>) {
    if (!list || busy || membership.has(book.id)) return
    add.reset()
    setAddedTitle('')
    add.mutate(
      { listId: list.id, bookId: book.id },
      { onSuccess: () => setAddedTitle(book.title) }
    )
  }
  // Cierra la búsqueda y conserva los libros añadidos en la colección.
  function closeSearch() {
    setSearching(false)
    setText('')
    setAddedTitle('')
    add.reset()
  }
  const hidden = !owner && query.isFetching
  const rows = searching
    ? term.length >= 1 && text.trim() === term
      ? (search.data ?? [])
      : []
    : (list?.items.map((i) => i.book) ?? [])
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ListHeader title={t('lists.listFallback')} />
      {query.isPending || hidden ? (
        <ListLoading />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !list ? (
        <ErrorState message={t('lists.notFound')} />
      ) : (
        <View className="flex-1 w-full max-w-3xl self-center">
          <FlashList
            data={rows}
            keyExtractor={(b) => b.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingBottom: insets.bottom + 32
            }}
            refreshControl={
              !searching ? (
                <RefreshControl
                  refreshing={query.isRefetching}
                  onRefresh={() => query.refetch()}
                  tintColor={c.text}
                />
              ) : undefined
            }
            ListHeaderComponent={
              <View className="gap-5 pt-7 pb-5">
                {!searching && list.items.length > 0 && (
                  <View
                    className="flex-row justify-center gap-5 rounded-card bg-sr py-6"
                    aria-hidden
                  >
                    {list.items.slice(0, 3).map((i) => (
                      <BookCover
                        key={i.id}
                        book={i.book}
                        width={84}
                        height={126}
                      />
                    ))}
                  </View>
                )}
                <View className="gap-3">
                  <Text
                    accessibilityRole="header"
                    className="font-display text-2xl text-text"
                  >
                    {list.name}
                  </Text>
                  <View className="flex-row flex-wrap items-center gap-2">
                    {list.visibility === 'private' ? (
                      <Lock size={16} color={c.t2} />
                    ) : (
                      <Globe size={16} color={c.t2} />
                    )}
                    <Text className="font-body text-xs text-t2">
                      {t('lists.booksCount', { count: list.books_count })} ·{' '}
                      {t('lists.' + list.visibility)}
                    </Text>
                  </View>
                  {!!list.description && (
                    <Text className="font-body text-sm text-t2">
                      {list.description}
                    </Text>
                  )}
                </View>
                {owner ? (
                  <View className="flex-row flex-wrap gap-2">
                    <ListAction
                      label={t(searching ? 'common.done' : 'lists.addBooks')}
                      onPress={() =>
                        searching ? closeSearch() : setSearching(true)
                      }
                    />
                    <ListAction
                      label={t('lists.editTitle')}
                      disabled={busy}
                      onPress={() =>
                        router.push({
                          pathname: '/list/edit/[slug]',
                          params: { slug }
                        })
                      }
                    />
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      like.liked ? 'lists.unlike' : 'lists.like'
                    )}
                    accessibilityState={{
                      selected: like.liked,
                      disabled: like.isPending
                    }}
                    onPress={() => like.toggle()}
                    disabled={like.isPending}
                    className="min-h-12 flex-row items-center gap-2 self-start rounded-md bg-sr px-4"
                  >
                    <Heart
                      size={20}
                      color={c.text}
                      fill={like.liked ? c.text : 'none'}
                    />
                    <Text className="font-body text-xs text-text">
                      {like.count}
                    </Text>
                  </Pressable>
                )}
                {searching ? (
                  <View className="gap-3">
                    <Text
                      accessibilityRole="header"
                      className="font-display-sb text-lg text-text"
                    >
                      {t('lists.findBooks')}
                    </Text>
                    <View className="flex-row items-center gap-1 rounded-md border border-border bg-surface">
                      <TextInput
                        accessibilityLabel={t('lists.searchBooks')}
                        value={text}
                        onChangeText={setText}
                        placeholder={t('lists.searchBooks')}
                        placeholderTextColor={c.t2}
                        className="min-h-12 flex-1 px-3 py-3 font-body text-base text-text"
                        returnKeyType="search"
                      />
                      {!!text && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t('lists.clearSearch')}
                          onPress={() => setText('')}
                          className="h-12 w-12 items-center justify-center"
                        >
                          <X size={20} color={c.text} />
                        </Pressable>
                      )}
                    </View>
                    {addedTitle && (
                      <Text
                        accessibilityLiveRegion="polite"
                        className="font-body text-xs text-t2"
                      >
                        {t('lists.addedBook', { title: addedTitle })}
                      </Text>
                    )}
                    {add.isError && (
                      <Text
                        accessibilityRole="alert"
                        className="font-body text-xs text-text"
                      >
                        {t('lists.addError')}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text
                    accessibilityRole="header"
                    className="font-display-sb text-lg text-text"
                  >
                    {t('lists.booksLabel')}
                  </Text>
                )}
              </View>
            }
            renderItem={({ item: book }) => {
              const item = list.items.find((i) => i.book.id === book.id),
                added = membership.has(book.id)
              return (
                <View className="mb-3 flex-row items-center gap-3 rounded-card bg-surface p-4">
                  <View className="flex-1 min-w-0">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={book.title}
                      onPress={() =>
                        router.push({
                          pathname: '/book/[id]',
                          params: { id: book.id }
                        })
                      }
                      className="flex-1 min-w-0 flex-row items-center gap-3 rounded-md active:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <BookCover book={book} width={56} height={84} />
                      <View className="flex-1 gap-1">
                        <Text
                          className="font-display-sb text-lg text-text"
                          numberOfLines={3}
                        >
                          {book.title}
                        </Text>
                        <Text
                          className="font-body text-xs text-t2"
                          numberOfLines={2}
                        >
                          {book.authors?.join(', ')}
                        </Text>
                      </View>
                    </Pressable>
                    {!searching && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          t('lists.registerReading') + ': ' + book.title
                        }
                        onPress={() => setSelected(book)}
                        className="min-h-12 justify-center ml-[68px] rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <Text className="font-body-sb text-xs text-text">
                          {t('lists.registerReading')}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {searching ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t(
                        added ? 'lists.alreadyAdded' : 'lists.addBookNamed',
                        { title: book.title }
                      )}
                      accessibilityState={{
                        disabled: busy || added,
                        busy: add.isPending && add.variables?.bookId === book.id
                      }}
                      disabled={busy || added}
                      onPress={() => addBook(book)}
                      className="h-12 w-12 items-center justify-center rounded-md bg-sr active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {add.isPending && add.variables?.bookId === book.id ? (
                        <ActivityIndicator color={c.text} />
                      ) : added ? (
                        <Check size={22} color={c.text} />
                      ) : (
                        <Plus size={22} color={c.text} />
                      )}
                    </Pressable>
                  ) : owner && item ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('lists.removeNamed', {
                        title: book.title
                      })}
                      disabled={busy}
                      onPress={() => {
                        remove.reset()
                        setRemoveItem(item)
                      }}
                      className="h-12 w-12 items-center justify-center rounded-md active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <Trash2 size={20} color={c.t2} />
                    </Pressable>
                  ) : null}
                </View>
              )
            }}
            ListEmptyComponent={
              searching ? (
                term.length < 1 || text.trim() !== term ? (
                  <Text className="font-body text-xs text-t2 py-5">
                    {t('lists.searchHint')}
                  </Text>
                ) : search.isPending ? (
                  <ListLoading />
                ) : search.isError ? (
                  <View className="py-8">
                    <ErrorState onRetry={() => search.refetch()} />
                  </View>
                ) : (
                  <Text className="font-body text-sm text-t2 py-5">
                    {t('lists.noResults')}
                  </Text>
                )
              ) : (
                <View className="gap-2 py-7">
                  <Text className="font-display text-xl text-text">
                    {t('lists.emptyList')}
                  </Text>
                  <Text className="font-body text-sm text-t2">
                    {t(owner ? 'lists.emptyHint' : 'lists.emptyPublic')}
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              owner && !searching ? (
                <View className="mt-8 border-t border-border pt-4">
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => {
                      del.reset()
                      setDeleteOpen(true)
                    }}
                    className="min-h-12 justify-center"
                  >
                    <Text className="font-body text-xs text-t2">
                      {t('lists.deleteList')}
                    </Text>
                  </Pressable>
                </View>
              ) : null
            }
          />
        </View>
      )}
      {owner && removeItem && (
        <ConfirmDialog
          title={t('lists.removeBook')}
          description={t('lists.removeBookConfirm', {
            title: removeItem.book.title
          })}
          confirmLabel={t('lists.remove')}
          pending={remove.isPending}
          error={remove.isError ? t('lists.removeError') : undefined}
          onClose={() => setRemoveItem(null)}
          onConfirm={() =>
            remove.mutate(removeItem.id, {
              onSuccess: () => setRemoveItem(null)
            })
          }
        />
      )}
      {owner && deleteOpen && list && (
        <ConfirmDialog
          title={t('lists.deleteList')}
          description={t('lists.deleteConfirm', { name: list.name })}
          pending={del.isPending}
          error={del.isError ? t('lists.deleteError') : undefined}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() =>
            del.mutate(list.id, { onSuccess: () => router.replace('/profile') })
          }
        />
      )}
      {selected && (
        <BookReadingSheet book={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  )
}
