import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '~/components/ui/Avatar';
import { useFollow } from '~/features/user/hooks/useFollow';
import type { SearchUser } from '~/features/user/user.queries';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface Props {
  user: SearchUser;
}

export function UserCard({ user }: Props) {
  const router = useRouter();
  const c = useColors();
  const [followed, setFollowed] = useState(false);
  const { follow, unfollow } = useFollow(
    user.id,
    user.username,
    user.is_private ?? false,
  );

  function handleFollow(e: any) {
    e.stopPropagation();
    if (followed) {
      unfollow.mutate(undefined, { onSuccess: () => setFollowed(false) });
    } else {
      follow.mutate(undefined, { onSuccess: () => setFollowed(true) });
    }
  }

  return (
    <Pressable
      onPress={() => router.push(`/user/${user.username}` as any)}
      className="flex-row items-center gap-3 py-3 border-b border-border"
    >
      <Avatar
        displayName={user.display_name}
        username={user.username}
        avatarUrl={user.avatar_url}
        size={44}
      />

      <View className="flex-1 min-w-0">
        <Text className="text-xs font-body-sb text-text" numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text className="text-xs font-body text-t3 mt-0.5" numberOfLines={1}>
          @{user.username}
        </Text>
        {user.bio ? (
          <Text className="text-xs font-body text-t2 mt-0.5" numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </View>

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
    </Pressable>
  );
}
