import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Heart, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react-native';
import { Avatar } from '~/components/ui/Avatar';
import { StarRating } from '~/components/ui/StarRating';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { ReportSheet } from '~/features/user/components/ReportSheet';
import { ACT_LABEL, type FeedItemType, type MockFeedItem } from '~/mock';
import { fixed, useColors } from '~/theme/colors';

// ─── Constants ────────────────────────────────────────────────

const ACTIVITY_COLOR: Record<FeedItemType, string> = {
  finished_book:  fixed.status.read,
  started_book:   fixed.status.reading,
  wrote_review:   fixed.accent,
  added_to_list:  fixed.status.want,
  abandoned_book: fixed.status.abandoned,
  want_to_read:   fixed.status.want,
};

const ACTIVITY_LABEL: Record<FeedItemType, string> = {
  finished_book:  'Terminó de leer',
  started_book:   'Empezó a leer',
  wrote_review:   'Reseñó',
  added_to_list:  'Añadió a lista',
  abandoned_book: 'Abandonó',
  want_to_read:   'Quiere leer',
};

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

// ─── FeedCard ─────────────────────────────────────────────────

interface FeedCardProps {
  item: MockFeedItem;
  onLike: () => void;
}

export function FeedCard({ item, onLike }: FeedCardProps) {
  const router = useRouter();
  const c = useColors();
  const [isPeeking, setIsPeeking] = useState(false);
  const [showReport, setShowReport] = useState(false);

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
        { text: `Ver perfil`, onPress: () => router.push(`/user/${item.user.username}` as any) },
        { text: 'Reportar publicación', onPress: () => setShowReport(true) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }

  const activityColor = ACTIVITY_COLOR[item.type];

  return (
    <>
      <View className="bg-surface mb-px">

        {/* ── Header ─────────────────────────────────── */}
        <View className="flex-row items-center px-3.5 pt-3 pb-2.5 gap-2.5">
          <Pressable onPress={() => router.push(`/user/${item.user.username}` as any)}>
            <Avatar user={item.user} size={36} />
          </Pressable>

          <Pressable
            className="flex-1 min-w-0"
            onPress={() => router.push(`/user/${item.user.username}` as any)}
          >
            <Text numberOfLines={1}>
              <Text className="font-body-sb text-sm text-text">
                {item.user.name}
              </Text>
              <Text className="font-body text-xs text-t3">
                {'  @'}{item.user.username}
              </Text>
            </Text>
          </Pressable>

          <Text className="font-body text-xs text-t3 shrink-0">
            {item.time}
          </Text>

          <Pressable hitSlop={8} onPress={openMenu}>
            <MoreHorizontal size={18} color={c.t3} />
          </Pressable>
        </View>

        {/* ── Book Cover Band ─────────────────────────── */}
        <Pressable
          onPress={() => router.push(`/book/${item.book.id}` as any)}
          className="items-center justify-center py-7"
          style={{ backgroundColor: item.book.c1 }}
        >
          {/* Side accent stripes */}
          <View
            className="absolute left-0 top-0 bottom-0 w-[5px]"
            style={{ backgroundColor: alpha(item.book.c2, 0.55) }}
          />
          <View
            className="absolute right-0 top-0 bottom-0 w-[3px]"
            style={{ backgroundColor: alpha(item.book.c2, 0.18) }}
          />

          {/* Book cover */}
          <View
            className="w-[130px] h-[195px] rounded-sm overflow-hidden"
            style={{
              backgroundColor: item.book.c1,
              shadowColor: '#000',
              shadowOpacity: 0.65,
              shadowRadius: 14,
              shadowOffset: { width: 2, height: 8 },
              elevation: 16,
            }}
          >
            {/* Spine */}
            <View
              className="absolute left-0 top-0 bottom-0 w-[5px]"
              style={{ backgroundColor: item.book.c2 }}
            />
            {/* Text content */}
            <View className="flex-1 justify-end pl-3 pr-2 pb-3">
              <Text
                className="font-display text-xs"
                style={{
                  lineHeight: 15,
                  color: 'rgba(240,234,226,0.92)',
                }}
                numberOfLines={6}
              >
                {item.book.title}
              </Text>
              <Text
                className="font-body text-xs mt-[5px]"
                style={{ color: 'rgba(240,234,226,0.45)' }}
                numberOfLines={1}
              >
                {item.book.author}
              </Text>
            </View>
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
              {ACTIVITY_LABEL[item.type]}
            </Text>
          </View>

          {/* List name badge — bottom right (added_to_list only) */}
          {item.type === 'added_to_list' && item.listName ? (
            <View
              className="absolute bottom-[11px] right-[14px] rounded-sm px-2 py-1 border border-border"
              style={{ backgroundColor: alpha(c.sr, 0.88) }}
            >
              <Text className="font-body text-xs text-t2" numberOfLines={1}>
                {item.listName}
              </Text>
            </View>
          ) : null}
        </Pressable>

        {/* ── Actions ─────────────────────────────────── */}
        <View className="flex-row items-center px-3.5 pt-[11px] pb-[5px] gap-3.5">
          {/* Like */}
          <Pressable
            onPress={onLike}
            className="flex-row items-center gap-[5px]"
            hitSlop={8}
          >
            <Heart
              size={22}
              color={item.liked ? fixed.accent : c.t2}
              fill={item.liked ? fixed.accent : 'none'}
              strokeWidth={1.7}
            />
            <Text
              className="font-body-md text-xs"
              style={{ color: item.liked ? fixed.accent : c.t2 }}
            >
              {item.likes}
            </Text>
          </Pressable>

          {/* Comment */}
          <Pressable
            onPress={() => router.push({ pathname: '/comments/[id]', params: { id: item.id } } as any)}
            className="flex-row items-center gap-[5px]"
            hitSlop={8}
          >
            <MessageCircle size={21} color={c.t2} strokeWidth={1.7} />
            <Text className="font-body text-xs text-t2">{item.comments}</Text>
          </Pressable>

          {/* Share */}
          <Pressable hitSlop={8}>
            <Share2 size={20} color={c.t2} strokeWidth={1.7} />
          </Pressable>

          {/* Vistazo — peek without leaving the feed */}
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
            <Text className="font-body-md text-xs" style={{ color: fixed.accent }}>
              Vistazo
            </Text>
          </Pressable>
        </View>

        {/* ── Caption ─────────────────────────────────── */}
        <View className="px-3.5 pt-1 pb-3.5 gap-[5px]">
          {/* Rating */}
          {item.rating != null ? (
            <View className="flex-row items-center gap-1.5">
              <StarRating rating={item.rating} size={13} />
              <Text className="font-body-sb text-xs" style={{ color: fixed.star }}>
                {item.rating}
              </Text>
            </View>
          ) : null}

          {/* Activity summary */}
          <Text className="font-body text-xs text-t2" style={{ lineHeight: 19 }}>
            <Text className="font-body-sb text-text">
              {item.user.username}
            </Text>
            {'  '}
            <Text className="text-t2">{ACT_LABEL[item.type]}</Text>
            {'  '}
            <Text className="font-display-i text-text">
              &ldquo;{item.book.title}&rdquo;
            </Text>
            {item.type === 'added_to_list' && item.listName ? (
              <Text className="text-t2">
                {'  a  '}
                <Text style={{ color: fixed.accent }}>
                  &ldquo;{item.listName}&rdquo;
                </Text>
              </Text>
            ) : null}
          </Text>

          {/* Review preview */}
          {item.preview ? (
            <Text
              className="font-body text-xs text-t2"
              style={{ lineHeight: 19 }}
              numberOfLines={3}
            >
              {item.preview}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Peek sheet — BookDetailSheet without navigating */}
      {isPeeking ? (
        <BookDetailSheet
          book={item.book as any}
          onClose={() => setIsPeeking(false)}
        />
      ) : null}

      {showReport && (
        <ReportSheet
          target="content"
          targetName={`Publicación de @${item.user.username}`}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
