import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Heart, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Avatar } from '~/components/ui/Avatar';
import { StarRating } from '~/components/ui/StarRating';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { ReportSheet } from '~/features/user/components/ReportSheet';
import { useToggleActivityLike } from '~/features/feed/hooks/useToggleActivityLike';
import type { ActivityType, FeedItem } from '~/features/feed/feed.queries';
import { fixed, useColors } from '~/theme/colors';
import { formatRelativeTime } from '~/lib/utils';

// ─── Constants ────────────────────────────────────────────────

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  finished_book:  fixed.status.read,
  started_book:   fixed.status.reading,
  wrote_review:   fixed.accent,
  added_to_list:  fixed.status.want,
  abandoned_book: fixed.status.abandoned,
  want_to_read:   fixed.status.want,
};

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  finished_book:  'Terminó de leer',
  started_book:   'Empezó a leer',
  wrote_review:   'Reseñó',
  added_to_list:  'Añadió a lista',
  abandoned_book: 'Abandonó',
  want_to_read:   'Quiere leer',
};

const ACT_VERB: Record<ActivityType, string> = {
  finished_book:  'terminó de leer',
  started_book:   'empezó a leer',
  wrote_review:   'reseñó',
  added_to_list:  'agregó',
  abandoned_book: 'abandonó',
  want_to_read:   'quiere leer',
};

// Paleta de pares de colores para la cover band — derivada del ID del libro.
const COLOR_PAIRS: [string, string][] = [
  ['#1C1635', '#7B5EA7'],
  ['#2A1A08', '#C49A20'],
  ['#181818', '#AAAAAA'],
  ['#180F0F', '#8B3A3A'],
  ['#0A1E2A', '#2A8A8A'],
  ['#1E0808', '#C43A3A'],
  ['#0C1628', '#4A8AB8'],
  ['#1A1208', '#8B6A3A'],
  ['#0F180F', '#5A8A5A'],
  ['#1E1408', '#D4902A'],
  ['#1A0820', '#9B5FC0'],
  ['#081A14', '#3A9B7A'],
];

function bookColors(bookId: string): [string, string] {
  let h = 0;
  for (let i = 0; i < bookId.length; i++) {
    h = (h * 31 + bookId.charCodeAt(i)) >>> 0;
  }
  return COLOR_PAIRS[h % COLOR_PAIRS.length];
}

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

// ─── FeedCard ─────────────────────────────────────────────────

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const router = useRouter();
  const c = useColors();
  const [isPeeking, setIsPeeking] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const { liked, count, toggle, isPending } = useToggleActivityLike(
    item.id,
    item.liked,
    item.likes_count,
  );

  const displayName = item.user.display_name ?? item.user.username;
  const author = item.book.authors[0] ?? 'Autor desconocido';
  const [c1, c2] = bookColors(item.book.id);
  const activityColor = ACTIVITY_COLOR[item.activity_type];

  function openMenu() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', `Ver perfil de @${item.user.username}`, 'Reportar publicación'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) router.push(`/user/${item.user.username}` as any);
          if (index === 2) setShowReport(true);
        }
      );
    } else {
      Alert.alert(`@${item.user.username}`, undefined, [
        { text: 'Ver perfil', onPress: () => router.push(`/user/${item.user.username}` as any) },
        { text: 'Reportar publicación', onPress: () => setShowReport(true) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }

  return (
    <>
      <View className="bg-surface mb-px">

        {/* ── Header ─────────────────────────────────── */}
        <View className="flex-row items-center px-3.5 pt-3 pb-2.5 gap-2.5">
          <Pressable onPress={() => router.push(`/user/${item.user.username}` as any)}>
            <Avatar
              displayName={displayName}
              username={item.user.username}
              avatarUrl={item.user.avatar_url ?? undefined}
              size={36}
            />
          </Pressable>

          <Pressable
            className="flex-1 min-w-0"
            onPress={() => router.push(`/user/${item.user.username}` as any)}
          >
            <Text numberOfLines={1}>
              <Text className="font-body-sb text-sm text-text">{displayName}</Text>
              <Text className="font-body text-xs text-t3">{'  @'}{item.user.username}</Text>
            </Text>
          </Pressable>

          <Text className="font-body text-xs text-t3 shrink-0">
            {formatRelativeTime(item.created_at)}
          </Text>

          <Pressable hitSlop={8} onPress={openMenu}>
            <MoreHorizontal size={18} color={c.t3} />
          </Pressable>
        </View>

        {/* ── Book Cover Band ─────────────────────────── */}
        <Pressable
          onPress={() => router.push(`/book/${item.book.google_books_id}` as any)}
          className="items-center justify-center py-7"
          style={{ backgroundColor: c1 }}
        >
          {/* Side accent stripes */}
          <View className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: alpha(c2, 0.55) }} />
          <View className="absolute right-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: alpha(c2, 0.18) }} />

          {/* Book cover */}
          <View
            className="w-[130px] h-[195px] rounded-sm overflow-hidden"
            style={{
              backgroundColor: c1,
              shadowColor: '#000',
              shadowOpacity: 0.65,
              shadowRadius: 14,
              shadowOffset: { width: 2, height: 8 },
              elevation: 16,
            }}
          >
            {item.book.cover_url ? (
              <Image
                source={{ uri: item.book.cover_url }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <>
                {/* Spine */}
                <View className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: c2 }} />
                {/* Text content */}
                <View className="flex-1 justify-end pl-3 pr-2 pb-3">
                  <Text
                    className="font-display text-xs"
                    style={{ lineHeight: 15, color: 'rgba(240,234,226,0.92)' }}
                    numberOfLines={6}
                  >
                    {item.book.title}
                  </Text>
                  <Text
                    className="font-body text-xs mt-[5px]"
                    style={{ color: 'rgba(240,234,226,0.45)' }}
                    numberOfLines={1}
                  >
                    {author}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Activity badge — bottom left */}
          <View
            className="absolute bottom-[11px] left-[14px] rounded-full px-2.5 py-[5px] border"
            style={{
              backgroundColor: alpha(activityColor, 0.2),
              borderColor: alpha(activityColor, 0.65),
            }}
          >
            <Text className="font-body-md text-xs" style={{ color: activityColor }}>
              {ACTIVITY_LABEL[item.activity_type]}
            </Text>
          </View>

          {/* List name badge — bottom right (added_to_list only) */}
          {item.activity_type === 'added_to_list' && item.list_name ? (
            <View
              className="absolute bottom-[11px] right-[14px] rounded-sm px-2 py-1 border border-border"
              style={{ backgroundColor: alpha(c.sr, 0.88) }}
            >
              <Text className="font-body text-xs text-t2" numberOfLines={1}>
                {item.list_name}
              </Text>
            </View>
          ) : null}
        </Pressable>

        {/* ── Actions ─────────────────────────────────── */}
        <View className="flex-row items-center px-3.5 pt-[11px] pb-[5px] gap-3.5">
          {/* Like */}
          <Pressable
            onPress={() => toggle()}
            disabled={isPending}
            className="flex-row items-center gap-[5px]"
            hitSlop={8}
          >
            <Heart
              size={22}
              color={liked ? fixed.accent : c.t2}
              fill={liked ? fixed.accent : 'none'}
              strokeWidth={1.7}
            />
            <Text className="font-body-md text-xs" style={{ color: liked ? fixed.accent : c.t2 }}>
              {count}
            </Text>
          </Pressable>

          {/* Comment */}
          <Pressable
            onPress={() => router.push({
              pathname: '/comments/[id]',
              params: { id: item.id, type: 'activity' },
            } as any)}
            className="flex-row items-center gap-[5px]"
            hitSlop={8}
          >
            <MessageCircle size={21} color={c.t2} strokeWidth={1.7} />
          </Pressable>

          {/* Share */}
          <Pressable
            hitSlop={8}
            onPress={() =>
              Share.share({
                message: `"${item.book.title}" en Lexa · https://lexareads.app/book/${item.book.google_books_id}`,
              }).catch(() => {})
            }
          >
            <Share2 size={20} color={c.t2} strokeWidth={1.7} />
          </Pressable>

          {/* Vistazo */}
          <Pressable
            onPress={() => setIsPeeking(true)}
            className="ml-auto flex-row items-center gap-[5px] rounded-full px-2.5 py-[5px] border"
            style={{
              backgroundColor: alpha(fixed.accent, 0.1),
              borderColor: alpha(fixed.accent, 0.3),
            }}
            hitSlop={8}
          >
            <BookOpen size={13} color={fixed.accent} strokeWidth={2} />
            <Text className="font-body-md text-xs text-accent">
              Vistazo
            </Text>
          </Pressable>
        </View>

        {/* ── Caption ─────────────────────────────────── */}
        <View className="px-3.5 pt-1 pb-3.5 gap-[5px]">
          {/* Activity summary */}
          <Text className="font-body text-xs text-t2 leading-[19px]">
            <Text className="font-body-sb text-text">{item.user.username}</Text>
            {'  '}
            <Text className="text-t2">{ACT_VERB[item.activity_type]}</Text>
            {'  '}
            <Text className="font-display-i text-text">&ldquo;{item.book.title}&rdquo;</Text>
            {item.activity_type === 'added_to_list' && item.list_name ? (
              <Text className="text-t2">
                {'  a  '}
                <Text className="text-accent">&ldquo;{item.list_name}&rdquo;</Text>
              </Text>
            ) : null}
          </Text>

          {/* Review preview */}
          {item.review_preview ? (
            <Text
              className="font-body text-xs text-t2 leading-[19px]"
              numberOfLines={3}
            >
              {item.review_preview}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Peek sheet */}
      {isPeeking ? (
        <BookDetailSheet
          book={item.book as any}
          onClose={() => setIsPeeking(false)}
        />
      ) : null}

      {showReport && (
        <ReportSheet
          targetType="activity"
          targetId={item.id}
          targetName={`Publicación de @${item.user.username}`}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
