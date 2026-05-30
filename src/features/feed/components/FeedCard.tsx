import { useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Heart, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react-native';
import { Avatar } from '~/components/ui/Avatar';
import { StarRating } from '~/components/ui/StarRating';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { ACT_LABEL, type FeedItemType, type MockFeedItem } from '~/mock';
import { fixed, rawDark, rawLight } from '~/theme/colors';

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
  const scheme = useColorScheme();
  const raw = scheme === 'dark' ? rawDark : rawLight;
  const [isPeeking, setIsPeeking] = useState(false);

  const activityColor = ACTIVITY_COLOR[item.type];

  return (
    <>
      <View style={{ backgroundColor: raw.surface, marginBottom: 1 }}>

        {/* ── Header ─────────────────────────────────── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 10,
          gap: 10,
        }}>
          <Avatar user={item.user} size={36} />

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1}>
              <Text className="font-body-sb text-sm" style={{ color: raw.text }}>
                {item.user.name}
              </Text>
              <Text className="font-body text-xs" style={{ color: raw.t3 }}>
                {'  @'}{item.user.username}
              </Text>
            </Text>
          </View>

          <Text className="font-body text-xs" style={{ color: raw.t3, flexShrink: 0 }}>
            {item.time}
          </Text>

          <Pressable hitSlop={8}>
            <MoreHorizontal size={18} color={raw.t3} />
          </Pressable>
        </View>

        {/* ── Book Cover Band ─────────────────────────── */}
        <Pressable
          onPress={() => router.push(`/book/${item.book.id}` as any)}
          style={{
            backgroundColor: item.book.c1,
            paddingVertical: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Side accent stripes */}
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: alpha(item.book.c2, 0.55) }} />
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, backgroundColor: alpha(item.book.c2, 0.18) }} />

          {/* Book cover */}
          <View style={{
            width: 130,
            height: 195,
            borderRadius: 6,
            backgroundColor: item.book.c1,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.65,
            shadowRadius: 14,
            shadowOffset: { width: 2, height: 8 },
            elevation: 16,
          }}>
            {/* Spine */}
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: item.book.c2 }} />
            {/* Text content */}
            <View style={{ flex: 1, justifyContent: 'flex-end', paddingLeft: 12, paddingRight: 8, paddingBottom: 12 }}>
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
                className="font-body text-xs"
                style={{
                  color: 'rgba(240,234,226,0.45)',
                  marginTop: 5,
                }}
                numberOfLines={1}
              >
                {item.book.author}
              </Text>
            </View>
          </View>

          {/* Activity badge — bottom left */}
          <View style={{
            position: 'absolute',
            bottom: 11,
            left: 14,
            backgroundColor: alpha(activityColor, 0.2),
            borderWidth: 1,
            borderColor: alpha(activityColor, 0.65),
            borderRadius: 100,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}>
            <Text className="font-body-md text-xs" style={{ color: activityColor }}>
              {ACTIVITY_LABEL[item.type]}
            </Text>
          </View>

          {/* List name badge — bottom right (added_to_list only) */}
          {item.type === 'added_to_list' && item.listName ? (
            <View style={{
              position: 'absolute',
              bottom: 11,
              right: 14,
              backgroundColor: alpha(raw.sr, 0.88),
              borderWidth: 1,
              borderColor: raw.border,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}>
              <Text className="font-body text-xs" style={{ color: raw.t2 }} numberOfLines={1}>
                {item.listName}
              </Text>
            </View>
          ) : null}
        </Pressable>

        {/* ── Actions ─────────────────────────────────── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingTop: 11,
          paddingBottom: 5,
          gap: 14,
        }}>
          {/* Like */}
          <Pressable onPress={onLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} hitSlop={8}>
            <Heart
              size={22}
              color={item.liked ? fixed.accent : raw.t2}
              fill={item.liked ? fixed.accent : 'none'}
              strokeWidth={1.7}
            />
            <Text className="font-body-md text-xs" style={{ color: item.liked ? fixed.accent : raw.t2 }}>
              {item.likes}
            </Text>
          </Pressable>

          {/* Comment */}
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} hitSlop={8}>
            <MessageCircle size={21} color={raw.t2} strokeWidth={1.7} />
            <Text className="font-body text-xs" style={{ color: raw.t2 }}>
              {item.comments}
            </Text>
          </Pressable>

          {/* Share */}
          <Pressable hitSlop={8}>
            <Share2 size={20} color={raw.t2} strokeWidth={1.7} />
          </Pressable>

          {/* Vistazo — peek without leaving the feed */}
          <Pressable
            onPress={() => setIsPeeking(true)}
            style={{
              marginLeft: 'auto',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: alpha(fixed.accent, 0.1),
              borderWidth: 1,
              borderColor: alpha(fixed.accent, 0.3),
              borderRadius: 100,
              paddingHorizontal: 10,
              paddingVertical: 5,
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
        <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14, gap: 5 }}>
          {/* Rating */}
          {item.rating != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StarRating rating={item.rating} size={13} />
              <Text className="font-body-sb text-xs" style={{ color: fixed.star }}>
                {item.rating}
              </Text>
            </View>
          ) : null}

          {/* Activity summary */}
          <Text className="font-body text-xs" style={{ color: raw.t2, lineHeight: 19 }}>
            <Text className="font-body-sb" style={{ color: raw.text }}>
              {item.user.username}
            </Text>
            {'  '}
            <Text style={{ color: raw.t2 }}>{ACT_LABEL[item.type]}</Text>
            {'  '}
            <Text className="font-display-i" style={{ color: raw.text }}>
              &ldquo;{item.book.title}&rdquo;
            </Text>
            {item.type === 'added_to_list' && item.listName ? (
              <Text style={{ color: raw.t2 }}>
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
              className="font-body text-xs"
              style={{ color: raw.t2, lineHeight: 19 }}
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
    </>
  );
}
