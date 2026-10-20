import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Send, Trash2, EyeOff } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar } from '~/components/ui/Avatar'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { Skeleton } from '~/components/ui/Skeleton'
import { SpoilerText } from '~/features/reviews/components/SpoilerText'
import { MAX_COMMENT_LENGTH } from '~/lib/content-limits'
import { formatRelativeTime } from '~/lib/utils'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import { commentContextQueryOptions, type CommentRow } from '../feed.queries'
import { useComments } from '../hooks/useComments'
import { useCreateComment } from '../hooks/useCreateComment'
import { useDeleteComment } from '../hooks/useDeleteComment'

// Muestra un hilo solo cuando el padre es accesible y el lector acepta sus spoilers.
export default function CommentsScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const inputRef = useRef<TextInput>(null)
  const posting = useRef(false)
  const [text, setText] = useState('')
  const [containsSpoilers, setContainsSpoilers] = useState(false)
  const [revealedThread, setRevealedThread] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<CommentRow | null>(null)
  const userId = useAuthStore((s) => s.user?.id)
  const targetType = type === 'review' ? 'review' : 'activity'
  const validRoute =
    !!id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    ) &&
    (type == null || type === 'review' || type === 'activity')
  const context = useQuery({
    ...commentContextQueryOptions(targetType, id ?? ''),
    enabled: validRoute
  })
  const hidden =
    !!context.data?.containsSpoilers && revealedThread !== context.data.version
  const allowed = validRoute && context.isSuccess && !hidden
  const comments = useComments(targetType, id ?? '', allowed)
  const create = useCreateComment(targetType, id ?? '')
  const remove = useDeleteComment(targetType, id ?? '')
  const rows = comments.data?.pages.flatMap((page) => page.items) ?? []

  // Conserva el borrador si falla el envío y bloquea pulsaciones repetidas, incluido Enter.
  function submitComment() {
    const body = text.trim()
    if (
      !allowed ||
      comments.isError ||
      posting.current ||
      create.isPending ||
      !body ||
      body.length > MAX_COMMENT_LENGTH
    )
      return
    posting.current = true
    create.mutate(
      { body, containsSpoilers },
      {
        onSuccess: () => {
          setText('')
          setContainsSpoilers(false)
        },
        onSettled: () => {
          posting.current = false
        }
      }
    )
  }

  // Revalida primero el padre para que un fallo o cambio de privacidad no se muestre como vacío.
  function retry() {
    void context.refetch()
    if (allowed) void comments.refetch()
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      <View className="w-full max-w-2xl self-center flex-row items-center gap-3 border-b border-border px-container py-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-md active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeft size={24} color={c.text} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 font-display-sb text-lg text-text"
        >
          {t('comments.title')}
        </Text>
      </View>
      {!validRoute || context.isError ? (
        <View className="flex-1 justify-center gap-3 px-container">
          <Text
            accessibilityRole="alert"
            className="font-body-sb text-sm text-text"
          >
            {t('comments.unavailable')}
          </Text>
          <Text className="font-body text-xs text-t2">
            {t('comments.unavailableHint')}
          </Text>
          <Pressable
            onPress={retry}
            accessibilityRole="button"
            className="min-h-12 justify-center rounded-md bg-sr px-4"
          >
            <Text className="font-body-sb text-xs text-text">
              {t('common.retry')}
            </Text>
          </Pressable>
        </View>
      ) : context.isPending ? (
        <View className="gap-4 p-5">
          <Skeleton height={64} animate={false} />
          <Skeleton height={64} animate={false} />
        </View>
      ) : hidden ? (
        <View className="w-full max-w-2xl flex-1 self-center justify-center gap-4 px-container">
          <EyeOff size={30} color={c.text} />
          <Text
            accessibilityRole="header"
            className="font-display-sb text-lg text-text"
          >
            {t('comments.spoilerThread')}
          </Text>
          <Text className="font-body text-xs text-t2">
            {t('comments.spoilerThreadHint')}
          </Text>
          <Pressable
            onPress={() => setRevealedThread(context.data.version)}
            accessibilityRole="button"
            className="min-h-12 items-center justify-center rounded-md bg-sr px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Text className="font-body-sb text-xs text-text">
              {t('comments.showThread')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View className="w-full max-w-2xl flex-1 self-center">
            {comments.isError ? (
              <View className="gap-3 p-5">
                <Text
                  accessibilityRole="alert"
                  className="font-body text-xs text-text"
                >
                  {t('comments.loadError')}
                </Text>
                <Pressable
                  onPress={retry}
                  accessibilityRole="button"
                  className="min-h-12 justify-center rounded-md bg-sr px-4"
                >
                  <Text className="font-body-sb text-xs text-text">
                    {t('common.retry')}
                  </Text>
                </Pressable>
              </View>
            ) : comments.isPending ? (
              <View className="gap-4 p-5">
                <Skeleton height={64} animate={false} />
                <Skeleton height={64} animate={false} />
              </View>
            ) : (
              <FlashList
                data={rows}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 18,
                  paddingBottom: 24
                }}
                ListEmptyComponent={
                  <View className="gap-2 py-12">
                    <Text className="font-body-sb text-sm text-text">
                      {t('comments.empty')}
                    </Text>
                    <Text className="font-body text-xs text-t2">
                      {t('comments.emptyHint')}
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  comments.hasNextPage ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={comments.isFetchingNextPage}
                      onPress={() => void comments.fetchNextPage()}
                      className="min-h-12 items-center justify-center rounded-md bg-sr px-4"
                    >
                      {comments.isFetchingNextPage ? (
                        <ActivityIndicator color={c.text} />
                      ) : (
                        <Text className="font-body-sb text-xs text-text">
                          {t('comments.loadMore')}
                        </Text>
                      )}
                    </Pressable>
                  ) : null
                }
                renderItem={({ item }) => (
                  <View className="flex-row gap-3 border-b border-border py-4">
                    <Avatar
                      displayName={
                        item.user?.display_name ??
                        item.user?.username ??
                        t('comments.reader')
                      }
                      username={item.user?.username ?? ''}
                      avatarUrl={item.user?.avatar_url ?? undefined}
                      size={36}
                    />
                    <View className="min-w-0 flex-1 gap-2">
                      <Text className="font-body-sb text-xs text-text">
                        {item.user?.display_name ??
                          item.user?.username ??
                          t('comments.reader')}
                      </Text>
                      <Text className="font-body text-xs text-t2">
                        {formatRelativeTime(item.created_at)}
                      </Text>
                      <SpoilerText
                        contentId={item.id}
                        body={item.body}
                        containsSpoilers={item.contains_spoilers}
                      />
                    </View>
                    {item.user_id === userId && (
                      <Pressable
                        onPress={() => {
                          remove.reset()
                          setDeleting(item)
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t('comments.delete')}
                        className="h-12 w-12 items-center justify-center rounded-md active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        <Trash2 size={20} color={c.text} />
                      </Pressable>
                    )}
                  </View>
                )}
              />
            )}
          </View>
          <View
            className="w-full max-w-2xl self-center gap-2 border-t border-border bg-surface px-container pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            {create.isError && (
              <Text
                accessibilityRole="alert"
                className="font-body text-xs text-text"
              >
                {t('comments.sendError')}
              </Text>
            )}
            <TextInput
              ref={inputRef}
              value={text}
              editable={!create.isPending && !comments.isError}
              onChangeText={setText}
              accessibilityLabel={t('comments.placeholder')}
              placeholder={t('comments.placeholder')}
              placeholderTextColor={c.t2}
              maxLength={MAX_COMMENT_LENGTH}
              returnKeyType="send"
              onSubmitEditing={submitComment}
              className="min-h-12 rounded-md border border-border bg-bg px-3 py-3 font-body text-xs text-text outline-none focus:border-accent"
            />
            <View className="flex-row flex-wrap items-center justify-between gap-3">
              <View className="flex-row items-center gap-2">
                <Switch
                  value={containsSpoilers}
                  disabled={create.isPending}
                  onValueChange={setContainsSpoilers}
                  accessibilityLabel={t('book.spoilers')}
                  trackColor={{ false: c.sh, true: c.accent }}
                />
                <Text className="font-body text-xs text-text">
                  {t('book.spoilers')}
                </Text>
              </View>
              <Pressable
                onPress={submitComment}
                disabled={create.isPending || comments.isError || !text.trim()}
                accessibilityRole="button"
                accessibilityLabel={t('comments.send')}
                accessibilityState={{
                  disabled: create.isPending || comments.isError || !text.trim()
                }}
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-md bg-sr px-4 py-3 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {create.isPending ? (
                  <ActivityIndicator color={c.text} />
                ) : (
                  <Send size={20} color={c.text} />
                )}
                <Text className="font-body-sb text-xs text-text">
                  {t('comments.send')}
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
      {deleting && (
        <ConfirmDialog
          title={t('comments.delete')}
          description={t('comments.deleteHint')}
          pending={remove.isPending}
          error={remove.isError ? t('comments.deleteError') : undefined}
          onConfirm={() =>
            remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </KeyboardAvoidingView>
  )
}
