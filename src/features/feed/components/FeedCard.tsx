import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Share, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  BookOpen,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2
} from 'lucide-react-native'
import { Avatar } from '~/components/ui/Avatar'
import { BookCover } from '~/components/ui/BookCover'
import { StitchSheet } from '~/components/ui/StitchSheet'
import { StitchButton } from '~/components/ui/StitchButton'
import { BookReadingSheet } from '~/features/book/components/BookReadingSheet'
import { SpoilerText } from '~/features/reviews/components/SpoilerText'
import { ReportSheet } from '~/features/user/components/ReportSheet'
import { useToggleActivityLike } from '../hooks/useToggleActivityLike'
import type { FeedItem } from '../feed.queries'
import { useColors } from '~/theme/colors'
import { formatRelativeTime } from '~/lib/utils'
import { useUIStore } from '~/stores/ui.store'

// Reúne autoría, libro y conversación en una tarjeta editorial; las portadas conservan el protagonismo.
export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()
  const [isPeeking, setIsPeeking] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const { toggle, isPending } = useToggleActivityLike(item.id)
  const displayName = item.user.display_name ?? item.user.username

  // Comparte el enlace existente sin exportar texto protegido de la reseña.
  function share() {
    void Share.share({
      message: t('feed.shareMessage', {
        title: item.book.title,
        url: `https://lexareads.app/book/${item.book.id}`
      })
    }).catch(() => useUIStore.getState().addToast(t('common.error')))
  }

  return (
    <>
      <View className="mx-4 mb-3 gap-4 rounded-xl bg-surface p-4">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push(`/user/${item.user.username}`)}
            accessibilityRole="button"
            accessibilityLabel={t('feed.profileOf', { name: displayName })}
            className="min-h-12 min-w-12 items-center justify-center"
          >
            <Avatar
              displayName={displayName}
              username={item.user.username}
              avatarUrl={item.user.avatar_url ?? undefined}
              size={40}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/user/${item.user.username}`)}
            accessibilityRole="button"
            className="min-h-12 flex-1 justify-center gap-1"
          >
            <Text
              className="font-body-sb text-base text-text"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text className="font-body text-xs text-t2" numberOfLines={2}>
              {t(`feed.verb.${item.activity_type}`)} ·{' '}
              {formatRelativeTime(item.created_at)}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowOptions(true)}
            accessibilityRole="button"
            accessibilityLabel={t('feed.moreOptions')}
            className="h-12 w-12 items-center justify-center rounded-full active:bg-sr"
          >
            <MoreHorizontal size={22} color={c.t2} />
          </Pressable>
        </View>
        {item.list_name && (
          <View className="self-start rounded-md bg-sr px-3 py-2">
            <Text className="font-body-sb text-xs text-text">
              {item.list_name}
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => router.push(`/book/${item.book.id}`)}
          accessibilityRole="button"
          accessibilityLabel={t('feed.viewBook', { title: item.book.title })}
          className="flex-row items-center gap-4 rounded-lg bg-bg p-3"
        >
          <BookCover book={item.book} width={64} height={96} />
          <View className="flex-1 gap-2">
            <Text
              className="font-display-sb text-md text-text"
              numberOfLines={2}
            >
              {item.book.title}
            </Text>
            <Text className="font-body text-sm text-t2" numberOfLines={2}>
              {item.book.authors.join(', ') || t('feed.unknownAuthor')}
            </Text>
            <Text className="self-start font-body-sb text-xs text-t2">
              {t(`feed.label.${item.activity_type}`)}
            </Text>
          </View>
        </Pressable>
        {item.review_preview ? (
          <SpoilerText
            body={item.review_preview}
            containsSpoilers={item.review_contains_spoilers}
            contentId={item.review_id ?? item.id}
            numberOfLines={4}
          />
        ) : null}
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => toggle(item.liked)}
            disabled={isPending}
            accessibilityRole="button"
            accessibilityState={{ selected: item.liked, disabled: isPending }}
            accessibilityLabel={t(item.liked ? 'feed.unlike' : 'feed.like', {
              count: item.likes_count
            })}
            className="min-h-12 min-w-12 flex-row items-center justify-center gap-2 rounded-full px-2 active:bg-sr"
          >
            <Heart
              size={21}
              color={item.liked ? c.error : c.t2}
              fill={item.liked ? c.error : 'none'}
              strokeWidth={1.7}
            />
            <Text className="font-body text-sm text-t2">
              {item.likes_count}
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/comments/[id]',
                params: { id: item.id, type: 'activity' }
              })
            }
            accessibilityRole="button"
            accessibilityLabel={t('feed.comment')}
            className="h-12 w-12 items-center justify-center rounded-full active:bg-sr"
          >
            <MessageCircle size={21} color={c.t2} />
          </Pressable>
          <Pressable
            onPress={share}
            accessibilityRole="button"
            accessibilityLabel={t('common.share')}
            className="h-12 w-12 items-center justify-center rounded-full active:bg-sr"
          >
            <Share2 size={20} color={c.t2} />
          </Pressable>
          <Pressable
            onPress={() => setIsPeeking(true)}
            accessibilityRole="button"
            accessibilityLabel={t('feed.peekBook')}
            className="ml-auto min-h-12 flex-row items-center justify-center gap-2 rounded-full bg-sr px-4"
          >
            <BookOpen size={17} color={c.text} />
            <Text className="font-body-sb text-sm text-text">
              {t('feed.peek')}
            </Text>
          </Pressable>
        </View>
      </View>
      {showOptions && (
        <StitchSheet
          title={t('feed.moreOptions')}
          onClose={() => setShowOptions(false)}
        >
          <StitchButton
            label={t('feed.viewProfile')}
            secondary
            onPress={() => {
              setShowOptions(false)
              router.push(`/user/${item.user.username}`)
            }}
          />
          <StitchButton
            label={t('feed.reportPost')}
            secondary
            onPress={() => {
              setShowOptions(false)
              setShowReport(true)
            }}
          />
        </StitchSheet>
      )}
      {isPeeking && (
        <BookReadingSheet
          book={item.book as any}
          onClose={() => setIsPeeking(false)}
        />
      )}
      {showReport && (
        <ReportSheet
          targetType="activity"
          targetId={item.id}
          targetName={t('feed.postBy', { username: item.user.username })}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}
