import { Text, View } from 'react-native';
import { useColors } from '~/theme/colors';

interface Props {
  booksRead: number;
  goal: number;
  goalYear: number;
}

export function ReadingGoal({ booksRead, goal, goalYear }: Props) {
  const c = useColors();
  const pct = Math.min(booksRead / goal, 1);

  return (
    <View className="mx-4 mb-5 rounded-md p-4 border border-border bg-surface">
      <View className="flex-row items-baseline justify-between mb-2">
        <Text className="text-sm font-body-md text-t2">Meta {goalYear}</Text>
        <Text className="font-body-sb text-lg" style={{ color: c.accent }}>
          {booksRead}
          <Text className="text-sm text-t3 font-body">/{goal}</Text>
        </Text>
      </View>

      <View className="h-1.5 rounded-full bg-sh overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct * 100}%`, backgroundColor: c.accent }}
        />
      </View>

      <Text className="text-xs font-body text-t3 mt-1.5">
        {Math.round(pct * 100)}% completado · {goal - booksRead} libros por leer
      </Text>
    </View>
  );
}
