import { Pressable, Text, View } from 'react-native';

const GENRES = [
  'Fantasía',
  'Realismo mágico',
  'Dark Academia',
  'Memorias',
  'Ciencia ficción',
  'Misterio',
  'Romance',
];

export function GenreChips() {
  return (
    <View className="mb-4">
      <Text
        className="text-xs text-t3 mb-2 tracking-widest"
        style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
      >
        Géneros
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {GENRES.map((g) => (
          <Pressable
            key={g}
            className="px-3 py-1 bg-surface rounded-full border border-border"
          >
            <Text className="text-sm text-t2 font-body">{g}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
