import { Pressable, Text, View } from 'react-native';
import { useColors } from '~/theme/colors';

interface Props {
  books: number;
  reviews: number;
  followers: number;
  following: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

export function ProfileStats({
  books,
  reviews,
  followers,
  following,
  onPressFollowers,
  onPressFollowing,
}: Props) {
  const c = useColors();

  const stats = [
    { label: 'Libros',     value: books,     onPress: undefined },
    { label: 'Reseñas',    value: reviews,   onPress: undefined },
    { label: 'Seguidores', value: followers, onPress: onPressFollowers },
    { label: 'Siguiendo',  value: following, onPress: onPressFollowing },
  ];

  return (
    <View className="mx-4 mb-5 rounded-md flex-row border border-border bg-surface">
      {stats.map(({ label, value, onPress }, i) => (
        <Pressable
          key={label}
          onPress={onPress}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 14,
            borderRightWidth: i < 3 ? 1 : 0,
            borderRightColor: c.border,
          }}
        >
          <Text className="text-lg font-body-sb text-text" style={{ lineHeight: 26 }}>
            {value}
          </Text>
          <Text className="text-xs font-body text-t3" style={{ marginTop: 4, letterSpacing: 0.2 }}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
