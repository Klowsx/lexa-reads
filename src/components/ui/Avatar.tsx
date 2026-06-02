import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { getAvatarColor, getInitials } from '~/lib/avatar';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface AvatarProps {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ displayName, username, avatarUrl, size = 34 }: AvatarProps) {
  const color = getAvatarColor(username);

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          flexShrink: 0,
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: alpha(color, 0.18),
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text
        className="font-body-sb"
        style={{ fontSize: size * 0.33, color }}
      >
        {getInitials(displayName)}
      </Text>
    </View>
  );
}
