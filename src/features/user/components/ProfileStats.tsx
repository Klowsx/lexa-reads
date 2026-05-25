import { Text, View } from 'react-native';

interface Props {
  books: number;
  reviews: number;
  followers: number;
  following: number;
}

export function ProfileStats({ books, reviews, followers, following }: Props) {
  const stats = [
    ['Libros',     books],
    ['Reseñas',    reviews],
    ['Seguidores', followers],
    ['Siguiendo',  following],
  ] as const;

  return (
    <View
      className="mx-4 mb-4 rounded-md flex-row border border-border"
      style={{ backgroundColor: '#1C1815' }}
    >
      {stats.map(([label, value], i) => (
        <View
          key={label}
          className="flex-1 items-center py-3.5"
          style={{ borderRightWidth: i < 3 ? 1 : 0, borderRightColor: '#35302B' }}
        >
          <Text className="text-lg font-body-sb text-text">{value}</Text>
          <Text className="text-xs font-body text-t3 mt-0.5">{label}</Text>
        </View>
      ))}
    </View>
  );
}
