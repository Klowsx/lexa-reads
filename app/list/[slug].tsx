import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Heart, MoreHorizontal, Star } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { useList } from '~/features/lists/hooks/useList';
import { useDeleteList } from '~/features/lists/hooks/useDeleteList';
import { useUpdateList } from '~/features/lists/hooks/useUpdateList';
import { useToggleListLike } from '~/features/lists/hooks/useToggleListLike';
import { useAuthStore } from '~/stores/auth.store';
import { useColors } from '~/theme/colors';
import type { Tables } from '~/types';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const GOLD = '#E8C05A';
const HERO_H = 252;

const BOOK_POSITIONS = [
  { left: -10, top: 30, rot: '-14deg' },
  { left: 58,  top: 60, rot: '6deg'  },
  { left: 150, top: 20, rot: '-8deg' },
  { left: 220, top: 50, rot: '10deg' },
];

// ─── Frosted-glass circular button ───────────────────────────

function HeroBtn({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: pressed ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.38)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center', justifyContent: 'center',
      })}
    >
      {children}
    </Pressable>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View className="px-[10px] py-1 rounded-full border bg-black/40 border-white/[0.16]">
      <Text className="font-body-sb text-white/90 tracking-[0.3px]" style={{ fontSize: 11 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ListDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();

  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: list, isLoading } = useList(slug ?? '');
  const deleteMutation = useDeleteList();
  const updateMutation = useUpdateList(slug ?? '');

  const { liked, count, toggle: toggleLike, isPending: likePending } = useToggleListLike(
    list?.id ?? '',
    false,
    list?.likes_count ?? 0,
  );

  const [selectedBook, setSelectedBook] = useState<Tables<'books'> | null>(null);

  const isOwner = list?.user_id === currentUserId;
  const col = list?.accent_color ?? '#4A96B8';

  function handleDelete() {
    if (!list) return;
    Alert.alert(
      t('lists.deleteList'),
      t('lists.deleteConfirm', { name: list.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(list.id, { onSuccess: () => router.back() }),
        },
      ]
    );
  }

  function handleToggleFeatured() {
    if (!list) return;
    updateMutation.mutate({ listId: list.id, isFeatured: !list.is_featured });
  }

  function openMenu() {
    Alert.alert(list?.name ?? t('lists.listFallback'), undefined, [
      { text: t('lists.editTitle'), onPress: () => router.push({ pathname: '/list/edit/[slug]', params: { slug: slug ?? '' } } as any) },
      { text: list?.is_featured ? t('lists.unfeature') : t('lists.feature'), onPress: handleToggleFeatured },
      { text: t('lists.deleteList'), style: 'destructive', onPress: handleDelete },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  if (!list) {
    return (
      <View className="flex-1 bg-bg items-center justify-center" style={{ paddingTop: insets.top }}>
        <Text className="font-body text-sm text-t3">{t('lists.notFound')}</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-body-sb text-sm text-accent">{t('common.back')}</Text>
        </Pressable>
      </View>
    );
  }

  const pills = [
    t('lists.booksCount', { count: list.books_count }),
    list.visibility === 'public' ? t('lists.public') : t('lists.private'),
    list.is_featured ? t('lists.featured') : null,
  ].filter(Boolean) as string[];

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Hero ── */}
        <View className="overflow-hidden" style={{ height: HERO_H }}>
          {/* Background gradient + book covers */}
          <LinearGradient
            colors={[alpha(col, 0.35), col]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            className="absolute inset-0"
          />
          {list.items.slice(0, 4).map((item, i) => {
            const pos = BOOK_POSITIONS[i] ?? { left: i * 80, top: 40, rot: '0deg' };
            return (
              <View
                key={item.id}
                style={{
                  position: 'absolute', left: pos.left, top: pos.top,
                  transform: [{ rotate: pos.rot }], opacity: 0.55,
                  width: 72, height: 108, borderRadius: 4, overflow: 'hidden',
                  backgroundColor: alpha(col, 0.5),
                }}
              >
                {item.book.cover_url ? (
                  <Image source={{ uri: item.book.cover_url }} className="w-[72px] h-[108px]" contentFit="cover" />
                ) : null}
              </View>
            );
          })}

          {/* Scrim */}
          <LinearGradient
            colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.72)']}
            locations={[0, 0.3, 1]}
            className="absolute inset-0"
          />

          {/* Nav bar */}
          <View
            className="flex-row items-center justify-between absolute left-[14px] right-[14px]"
            style={{ top: insets.top + 6 }}
          >
            <HeroBtn onPress={() => router.back()}>
              <ChevronLeft size={18} color="#fff" strokeWidth={2} />
            </HeroBtn>

            <View className="flex-row gap-2">
              {/* Like button */}
              <Pressable
                onPress={() => toggleLike()}
                disabled={likePending}
                style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: liked ? alpha('#ff4d4d', 0.5) : 'rgba(0,0,0,0.38)',
                  borderWidth: 1, borderColor: liked ? 'rgba(255,77,77,0.4)' : 'rgba(255,255,255,0.14)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Heart size={15} color={liked ? '#fff' : '#fff'} fill={liked ? '#ff4d4d' : 'none'} strokeWidth={1.9} />
              </Pressable>

              {/* Featured toggle */}
              {isOwner && (
                <HeroBtn onPress={handleToggleFeatured}>
                  <Star
                    size={15}
                    color={list.is_featured ? GOLD : '#fff'}
                    fill={list.is_featured ? GOLD : 'transparent'}
                    strokeWidth={1.9}
                  />
                </HeroBtn>
              )}

              {/* Options */}
              {isOwner && (
                <HeroBtn onPress={openMenu}>
                  <MoreHorizontal size={15} color="#fff" strokeWidth={2} />
                </HeroBtn>
              )}
            </View>
          </View>

          {/* Title + pills */}
          <View className="absolute bottom-0 left-0 right-0 p-[18px] pb-5">
            <Text
              className="text-white leading-[31px] text-lg font-display-bold mb-[10px]"
              style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}
              numberOfLines={2}
            >
              {list.name}
            </Text>
            <View className="flex-row gap-1.5 flex-wrap">
              {pills.map((tag) => <Pill key={tag} label={tag} />)}
            </View>
          </View>
        </View>

        {/* ── Description ── */}
        {list.description ? (
          <Text
            className="text-t2 leading-[22px] px-container pt-container font-display-i"
            style={{ fontSize: 13.5 }}
          >
            "{list.description}"
          </Text>
        ) : null}

        {/* ── Books header ── */}
        <View className="flex-row justify-between items-center px-4 pt-5 pb-3.5">
          <Text className="font-body-sb text-xs text-t3 tracking-widest uppercase">{t('lists.booksLabel')}</Text>
          {isOwner && (
            <Pressable
              onPress={() => router.push({ pathname: '/book/add-to-list', params: { listSlug: slug ?? '' } } as any)}
              hitSlop={6}
            >
              <Text className="text-xs font-body-sb text-accent">{t('lists.add')}</Text>
            </Pressable>
          )}
        </View>

        {/* ── Books grid ── */}
        {list.items.length === 0 ? (
          <View
            className="mx-4 rounded-lg border border-border bg-surface items-center py-9 px-5 mb-10"
          >
            <Text className="text-[32px] mb-2.5">📚</Text>
            <Text className="text-sm font-body-md text-t2 mb-1.5">{t('lists.emptyList')}</Text>
            <Text className="text-xs font-body text-t3">{t('lists.emptyHint')}</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap px-4 gap-3 pb-10">
            {list.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedBook(item.book as Tables<'books'>)}
                className="w-[100px]"
              >
                <View className="w-[100px] h-[150px] rounded-sm overflow-hidden" style={{ backgroundColor: alpha(col, 0.3) }}>
                  {item.book.cover_url ? (
                    <Image source={{ uri: item.book.cover_url }} className="w-[100px] h-[150px]" contentFit="cover" />
                  ) : null}
                </View>
                <Text className="text-xs font-body-md text-t2 mt-1.5 leading-[15px] w-[100px]" numberOfLines={2}>
                  {item.book.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {selectedBook && (
        <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
