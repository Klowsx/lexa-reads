import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useColors } from '~/theme/colors';

interface Props {
  booksRead: number;
  goal: number;
  goalYear: number;
  onEditGoal?: () => void;
}

export function ReadingGoal({ booksRead, goal, goalYear, onEditGoal }: Props) {
  const c = useColors();
  const pct = Math.min(booksRead / goal, 1);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000,
      delay: 150,
      useNativeDriver: false,
    }).start();
  }, []);

  const remaining = goal - booksRead;

  return (
    <View className="mx-4 mb-5 rounded-md border border-border bg-surface p-4">
      <View className="flex-row justify-between items-start mb-3.5">
        <View className="flex-1">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
            Meta {goalYear}
          </Text>
          <Text className="text-xs font-body text-t2">
            {remaining > 0
              ? `${remaining} libros más para lograrlo`
              : '¡Meta cumplida este año!'}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-display-sb text-accent" style={{ fontSize: 30, lineHeight: 32 }}>
            {booksRead}
          </Text>
          <Text className="text-xs font-body text-t3">de {goal}</Text>
        </View>
      </View>

      <View className="h-1.5 rounded-full bg-sh overflow-hidden mb-2">
        <Animated.View
          className="h-full rounded-full"
          style={{
            backgroundColor: c.accent,
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ['2%', `${Math.round(pct * 100)}%`],
            }),
          }}
        />
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-xs font-body text-t3">{Math.round(pct * 100)}% completado</Text>
        {onEditGoal && (
          <Pressable onPress={onEditGoal} hitSlop={6}>
            <Text className="text-xs font-body-sb text-accent">Editar meta →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
