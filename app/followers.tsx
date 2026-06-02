import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { FULL_USERS, type MockFullUser } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

type Tab = 'followers' | 'following';

function UserRow({ user, onPress }: { user: MockFullUser; onPress: () => void }) {
  const c = useColors();
  const [following, setFollowing] = useState(false);

  return (
    <View
      className="flex-row items-center px-4 py-3 gap-3"
      style={{ borderBottomWidth: 1, borderBottomColor: c.border }}
    >
      <Pressable onPress={onPress}>
        <Avatar user={user} size={44} />
      </Pressable>

      <Pressable onPress={onPress} className="flex-1 min-w-0">
        <Text className="text-xs font-body-sb text-text" numberOfLines={1}>
          {user.name}
        </Text>
        <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
          @{user.username}
        </Text>
        {user.bio ? (
          <Text className="text-xs font-body text-t2 mt-0.5" numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        onPress={() => setFollowing((f) => !f)}
        className="px-3.5 py-2 rounded-full border"
        style={{
          backgroundColor: following ? 'transparent' : alpha(c.accent, 0.1),
          borderColor: following ? c.border : alpha(c.accent, 0.35),
        }}
      >
        <Text
          className="text-xs font-body-sb"
          style={{ color: following ? c.t2 : c.accent }}
        >
          {following ? 'Siguiendo' : 'Seguir'}
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
    tabParam === 'following' ? 'following' : 'followers'
  );

  // Mock: show all full users as followers/following
  const users = FULL_USERS.filter((u) => u.username !== username);

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
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 items-center py-3"
              style={{
                borderBottomWidth: active ? 2 : 0,
                borderBottomColor: c.accent,
              }}
            >
              <Text
                className="text-xs font-body-sb"
                style={{ color: active ? c.accent : c.t3 }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {users.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-xs font-body text-t3 text-center">
            {activeTab === 'followers' ? 'Sin seguidores aún.' : 'No sigue a nadie aún.'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={users}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              onPress={() => router.push(`/user/${item.username}` as any)}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
