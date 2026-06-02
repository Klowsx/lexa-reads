import { Pressable, Text, View } from 'react-native';

interface Props {
  books: number;
  reviews: number;
  followers: number;
  following: number;
  onPressBooks?: () => void;
  onPressReviews?: () => void;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

export function ProfileStats({
  books,
  reviews,
  followers,
  following,
  onPressBooks,
  onPressReviews,
  onPressFollowers,
  onPressFollowing,
}: Props) {
  const stats = [
    { label: 'Libros',     value: books,     onPress: onPressBooks },
    { label: 'Reseñas',    value: reviews,   onPress: onPressReviews },
    { label: 'Seguidores', value: followers, onPress: onPressFollowers },
    { label: 'Siguiendo',  value: following, onPress: onPressFollowing },
  ];

  return (
    <View className="mx-4 mb-5 rounded-md flex-row border border-border bg-surface">
      {stats.map(({ label, value, onPress }, i) => (
        <Pressable
          key={label}
          onPress={onPress}
          className={`flex-1 items-center py-3.5 ${i < 3 ? 'border-r border-border' : ''}`}
        >
          <Text className="text-lg font-body-sb text-text leading-[26px]">
            {value ?? 0}
          </Text>
          <Text className="text-xs font-body text-t3 mt-1 tracking-wide">
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
