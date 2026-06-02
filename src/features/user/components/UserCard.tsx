import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '~/components/ui/Avatar';
import type { MockFullUser } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface Props {
  user: MockFullUser;
}

export function UserCard({ user }: Props) {
  const router = useRouter();
  const c = useColors();
  const [following, setFollowing] = useState(false);

  return (
    <Pressable
      onPress={() => router.push(`/user/${user.username}` as any)}
      className="flex-row items-center gap-3 py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: c.border }}
    >
      <Avatar user={user} size={44} />

      <View className="flex-1 min-w-0">
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
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          setFollowing((f) => !f);
        }}
        className="px-3.5 py-2 rounded-full border shrink-0"
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
    </Pressable>
  );
}
