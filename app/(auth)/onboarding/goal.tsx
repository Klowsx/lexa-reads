import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from '../../../src/features/auth/components';
import { useColors } from '~/theme/colors';

const QUICK_GOALS = [12, 24, 50, 100];

function getLabel(goal: number) {
  if (goal === 1) return '1 libro al año';
  const perMonth = Math.round((goal / 12) * 10) / 10;
  const pace =
    goal < 12 ? 'paso tranquilo' :
    goal < 30 ? 'ritmo cómodo' :
    goal < 60 ? 'lector activo' : 'lector intenso';
  return `Aprox. ${perMonth} libros al mes — ${pace}`;
}

export default function OnboardGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [goal, setGoal] = useState(50);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <OnboardHeader step={2} total={3} onBack={() => router.back()} />
      <View style={{ height: 12 }} />
      <StepBar step={2} total={3} />

      <View className="px-6 mb-4">
        <Text className="font-display-sb text-text" style={{ fontSize: 26, lineHeight: 32, letterSpacing: -0.3 }}>
          Tu meta para 2026
        </Text>
        <Text className="font-body text-t2 text-sm mt-2">
          ¿Cuántos libros quieres leer este año? Puedes cambiarla cuando quieras.
        </Text>
      </View>

      <View className="flex-row items-center justify-center gap-7 mt-4 mb-9">
        <Pressable
          onPress={() => setGoal((g) => Math.max(1, g - 1))}
          className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
        >
          <Text className="font-body-light text-text" style={{ fontSize: 22, lineHeight: 28 }}>−</Text>
        </Pressable>

        <View className="items-center min-w-[120px]">
          <Text className="font-display-sb" style={{ fontSize: 88, lineHeight: 88, letterSpacing: -4, color: c.accent }}>
            {goal}
          </Text>
          <Text className="font-body text-t3 uppercase mt-1.5" style={{ fontSize: 12, letterSpacing: 0.7 }}>
            libros
          </Text>
        </View>

        <Pressable
          onPress={() => setGoal((g) => Math.min(365, g + 1))}
          className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
        >
          <Text className="font-body-light text-text" style={{ fontSize: 22, lineHeight: 28 }}>+</Text>
        </Pressable>
      </View>

      <View className="flex-row justify-center gap-2">
        {QUICK_GOALS.map((n) => {
          const on = goal === n;
          return (
            <Pressable
              key={n}
              onPress={() => setGoal(n)}
              className="py-[7px] px-[14px] rounded-full bg-surface border border-border"
              style={on ? { borderColor: c.accent, backgroundColor: alpha(c.accent, 0.14) } : undefined}
            >
              <Text
                className="font-body-md text-t2"
                style={[{ fontSize: 12 }, on && { color: c.accent }]}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="font-body text-t3 text-center mt-7 px-8" style={{ fontSize: 12, lineHeight: 19 }}>
        {getLabel(goal)}
      </Text>

      <View style={{ flex: 1 }} />
      <View
        className="px-6 pt-5 border-t border-border/50"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Link href="/(auth)/onboarding/username" asChild>
          <PrimaryButton>Continuar</PrimaryButton>
        </Link>
      </View>
    </View>
  );
}
