import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUTH,
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from '../../../src/features/auth/components';

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
  const [goal, setGoal] = useState(50);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <OnboardHeader step={2} total={3} onBack={() => router.back()} />
      <View style={{ height: 12 }} />
      <StepBar step={2} total={3} />

      <View style={styles.header}>
        <Text style={styles.title}>Tu meta para 2026</Text>
        <Text style={styles.subtitle}>
          ¿Cuántos libros quieres leer este año? Puedes cambiarla cuando quieras.
        </Text>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        <Pressable
          onPress={() => setGoal((g) => Math.max(1, g - 1))}
          style={styles.stepBtn}
        >
          <Text style={styles.stepSign}>−</Text>
        </Pressable>

        <View style={styles.goalDisplay}>
          <Text style={styles.goalNumber}>{goal}</Text>
          <Text style={styles.goalUnit}>libros</Text>
        </View>

        <Pressable
          onPress={() => setGoal((g) => Math.min(365, g + 1))}
          style={styles.stepBtn}
        >
          <Text style={styles.stepSign}>+</Text>
        </Pressable>
      </View>

      {/* Quick picks */}
      <View style={styles.quickRow}>
        {QUICK_GOALS.map((n) => (
          <Pressable
            key={n}
            onPress={() => setGoal(n)}
            style={[styles.quickBtn, goal === n && styles.quickBtnOn]}
          >
            <Text style={[styles.quickLabel, goal === n && styles.quickLabelOn]}>
              {n}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.hint}>{getLabel(goal)}</Text>

      <View style={{ flex: 1 }} />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Link href="/(auth)/onboarding/username" asChild>
          <PrimaryButton>Continuar</PrimaryButton>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH.bg,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 26,
    color: AUTH.text,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH.t2,
    marginTop: 8,
    fontFamily: 'DMSans_400Regular',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 16,
    marginBottom: 36,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AUTH.surface,
    borderWidth: 1,
    borderColor: AUTH.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSign: {
    fontSize: 22,
    fontWeight: '300',
    color: AUTH.text,
    lineHeight: 28,
  },
  goalDisplay: {
    alignItems: 'center',
    minWidth: 120,
  },
  goalNumber: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 88,
    color: AUTH.accent,
    lineHeight: 88,
    letterSpacing: -4,
  },
  goalUnit: {
    fontSize: 12,
    color: AUTH.t3,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 6,
    fontFamily: 'DMSans_400Regular',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  quickBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: AUTH.surface,
    borderWidth: 1,
    borderColor: AUTH.border,
  },
  quickBtnOn: {
    borderColor: AUTH.accent,
    backgroundColor: alpha(AUTH.accent, 0.14),
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: AUTH.t2,
    fontFamily: 'DMSans_500Medium',
  },
  quickLabelOn: {
    color: AUTH.accent,
  },
  hint: {
    fontSize: 12,
    color: AUTH.t3,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 19,
    paddingHorizontal: 32,
    fontFamily: 'DMSans_400Regular',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: alpha(AUTH.border, 0.5),
  },
});
