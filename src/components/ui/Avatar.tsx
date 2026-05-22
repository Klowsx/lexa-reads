import { Text, View } from 'react-native';
import type { MockUser } from '~/mock';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface AvatarProps {
  user: Pick<MockUser, 'av' | 'avC'>;
  size?: number;
}

export function Avatar({ user, size = 34 }: AvatarProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: alpha(user.avC, 0.18),
        borderWidth: 1.5,
        borderColor: user.avC,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          fontSize: size * 0.33,
          fontFamily: 'DMSans_600SemiBold',
          color: user.avC,
        }}
      >
        {user.av}
      </Text>
    </View>
  );
}
