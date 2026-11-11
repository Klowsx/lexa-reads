import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Check, Plus, BookOpen } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookCover } from '~/components/ui/BookCover'
import { ErrorState } from '~/components/ui/ErrorState'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import { useUserLists } from '../hooks/useUserLists'
import { useAddBookToList } from '../hooks/useAddBookToList'
import { useRemoveBookFromList } from '../hooks/useRemoveBookFromList'
import { bookListsQueryOptions, type ListRow } from '../list.queries'
import { ListHeader, ListAction, ListLoading } from '../components/ListControls'

// Muestra la pertenencia guardada, permite revertirla y conserva el libro al crear una lista.
export default function BookListsScreen() {
  const { bookId = '', bookTitle = '' } = useLocalSearchParams<{
    bookId?: string
    bookTitle?: string
  }>()
  const uid = useAuthStore((s) => s.user?.id ?? ''),
    router = useRouter(),
    { t } = useTranslation(),
    c = useColors(),
    insets = useSafeAreaInsets()
  const lists = useUserLists(),
    membership = useQuery({
      ...bookListsQueryOptions(uid, bookId),
      staleTime: 0
    })
  const add = useAddBookToList(),
    remove = useRemoveBookFromList()
  const busy = add.isPending || remove.isPending
  // Alterna la relación real; un fallo conserva la selección y permite repetir la operación.
  function toggle(list: ListRow) {
    if (busy) return
    add.reset()
    remove.reset()
    const current = membership.data?.find((item) => item.list_id === list.id)
    if (current) remove.mutate(current.id)
    else add.mutate({ listId: list.id, bookId })
  }
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ListHeader title={t('lists.addToList')} />
      <View className="flex-1 w-full max-w-2xl self-center">
        {!bookId ? (
          <ErrorState message={t('lists.missingBook')} />
        ) : lists.isPending || membership.isPending ? (
          <ListLoading />
        ) : lists.isError || membership.isError ? (
          <ErrorState
            onRetry={() => {
              void lists.refetch()
              void membership.refetch()
            }}
          />
        ) : (
          <FlashList
            data={lists.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingBottom: insets.bottom + 32
            }}
            ListHeaderComponent={
              <View className="gap-4 py-5">
                <Text
                  accessibilityRole="header"
                  className="rounded-card bg-surface p-4 font-display-sb text-xl text-text"
                >
                  {bookTitle}
                </Text>
                <Text className="font-body text-xs text-t2">
                  {t('lists.selectorHint')}
                </Text>
                <ListAction
                  label={t('lists.newTitle')}
                  disabled={busy}
                  onPress={() =>
                    router.push({
                      pathname: '/list/new',
                      params: { bookId, bookTitle }
                    })
                  }
                />
                {(add.isError || remove.isError) && (
                  <Text
                    accessibilityRole="alert"
                    className="font-body text-xs text-text"
                  >
                    {t('lists.selectionError')}
                  </Text>
                )}
              </View>
            }
            renderItem={({ item }) => {
              const relation = membership.data?.find(
                  (row) => row.list_id === item.id
                ),
                cover = item.preview_books[0]
              const pending =
                (add.isPending && add.variables?.listId === item.id) ||
                (remove.isPending && remove.variables === relation?.id)
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  aria-checked={!!relation}
                  accessibilityLabel={item.name}
                  accessibilityState={{
                    checked: !!relation,
                    disabled: busy,
                    busy: pending
                  }}
                  disabled={busy}
                  onPress={() => toggle(item)}
                  className="mb-3 min-h-20 flex-row items-center gap-3 rounded-card bg-surface p-4 active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {cover ? (
                    <BookCover book={cover} width={40} height={60} />
                  ) : (
                    <View className="h-[60px] w-10 items-center justify-center rounded-sm bg-surface">
                      <BookOpen size={22} color={c.t2} />
                    </View>
                  )}
                  <View className="flex-1 gap-1">
                    <Text
                      className="font-body-sb text-sm text-text"
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text className="font-body text-xs text-t2">
                      {t('lists.booksCount', { count: item.books_count })} ·{' '}
                      {t('lists.' + item.visibility)}
                    </Text>
                  </View>
                  {pending ? (
                    <ActivityIndicator color={c.text} />
                  ) : relation ? (
                    <Check size={24} color={c.text} />
                  ) : (
                    <Plus size={24} color={c.t2} />
                  )}
                </Pressable>
              )
            }}
            ListEmptyComponent={
              <View className="gap-2 py-7">
                <Text className="font-display text-xl text-text">
                  {t('lists.noLists')}
                </Text>
                <Text className="font-body text-sm text-t2">
                  {t('profile.listsEmpty')}
                </Text>
              </View>
            }
            ListFooterComponent={
              <View className="pt-6">
                <ListAction
                  label={t('common.done')}
                  disabled={busy}
                  onPress={() =>
                    router.canGoBack()
                      ? router.back()
                      : router.replace('/profile')
                  }
                />
              </View>
            }
          />
        )}
      </View>
    </View>
  )
}
