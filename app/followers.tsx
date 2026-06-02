import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { useFollowers } from '~/features/user/hooks/useFollowers';
import { useFollowing } from '~/features/user/hooks/useFollowing';
import { useProfile } from '~/features/user/hooks/useProfile';
import { useFollow } from '~/features/user/hooks/useFollow';
import type { FollowUser } from '~/features/user/user.queries';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

type Tab = 'followers' | 'following';

function UserRow({ item }: { item: FollowUser }) {
  const router = useRouter();
  const c = useColors();
  // Estado local de follow para optimismo visual dentro de la lista.
  // La fuente de verdad se sincroniza al entrar al perfil del usuario.
  const [followed, setFollowed] = useState(false);
  const { follow, unfollow } = useFollow(
    item.user.id,
    item.user.username,
    item.user.is_private ?? false,
  );

  function handleFollow() {
    if (followed) {
      unfollow.mutate(undefined, { onSuccess: () => setFollowed(false) });
    } else {
      follow.mutate(undefined, { onSuccess: () => setFollowed(true) });
    }
  }

  return (
    <View className="flex-row items-center px-4 py-3 gap-3 border-b border-border">
      <Pressable
        onPress={() => router.push(`/user/${item.user.username}` as any)}
      >
        <Avatar
          displayName={item.user.display_name}
          username={item.user.username}
          avatarUrl={item.user.avatar_url}
          size={44}
        />
      </Pressable>

      <Pressable
        onPress={() => router.push(`/user/${item.user.username}` as any)}
        className="flex-1 min-w-0"
      >
        <Text className="text-xs font-body-sb text-text" numberOfLines={1}>
          {item.user.display_name}
        </Text>
        <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
          @{item.user.username}
        </Text>
        {item.user.bio ? (
          <Text className="text-xs font-body text-t2 mt-0.5" numberOfLines={1}>
            {item.user.bio}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        onPress={handleFollow}
        disabled={follow.isPending || unfollow.isPending}
        className="px-3.5 py-2 rounded-full border shrink-0"
        style={{
          backgroundColor: followed ? 'transparent' : alpha(c.accent, 0.1),
          borderColor: followed ? c.border : alpha(c.accent, 0.35),
        }}
      >
        <Text
          className="text-xs font-body-sb"
          style={{ color: followed ? c.t2 : c.accent }}
        >
          {followed ? 'Siguiendo' : 'Seguir'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function FollowersScreen() {
  const { username, tab: tabParam } = useLocalSearchParams<{
    username: string;
    tab?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam === 'following' ? 'following' : 'followers',
  );

  // Necesitamos el userId para las queries — viene del profile cacheado
  const { data: profile } = useProfile(username);
  const userId = profile?.id ?? '';

  const followersQuery = useFollowers(userId);
  const followingQuery = useFollowing(userId);

  const activeQuery = activeTab === 'followers' ? followersQuery : followingQuery;
  const items = activeQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const isLoading = activeQuery.isLoading;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-body-md text-sm text-t2 flex-1" numberOfLines={1}>
          @{username}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-border">
        {(['followers', 'following'] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          const label = tab === 'followers' ? 'Seguidores' : 'Siguiendo';
          const count =
            tab === 'followers'
              ? profile?.followers_count
              : profile?.following_count;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 items-center py-3 gap-0.5"
              style={{
                borderBottomWidth: active ? 2 : 0,
                borderBottomColor: c.accent,
              }}
            >
              <Text
                className="text-sm font-body-sb"
                style={{ color: active ? c.accent : c.t3 }}
              >
                {count ?? '—'}
              </Text>
              <Text
                className="text-xs font-body"
                style={{ color: active ? c.accent : c.t3 }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-xs font-body text-t3 text-center">
            {activeTab === 'followers'
              ? 'Sin seguidores aún.'
              : 'No sigue a nadie aún.'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          renderItem={({ item }) => <UserRow item={item} />}
          keyExtractor={(item) => item.follow_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => {
            if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
              activeQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            activeQuery.isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={c.accent} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
