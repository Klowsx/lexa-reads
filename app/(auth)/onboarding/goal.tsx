import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from "../../../src/features/auth/components";
import { useSaveOnboardingPreferences } from "~/features/auth/hooks/useOnboarding";
import { useMe } from "~/features/user/hooks/useMe";
import { cn } from "~/lib/utils";
import { useColors } from "~/theme/colors";
import { toAppError } from "~/types";

const QUICK_GOALS = [12, 24, 50, 100];

// Describe el ritmo aproximado de una meta anual para que se entienda su alcance.
function getLabel(goal: number) {
  if (goal === 1) return "1 libro al año";
  const perMonth = Math.round((goal / 12) * 10) / 10;
  const pace =
    goal < 12
      ? "paso tranquilo"
      : goal < 30
        ? "ritmo cómodo"
        : goal < 60
          ? "lector activo"
          : "lector intenso";
  return `Aprox. ${perMonth} libros al mes — ${pace}`;
}

// Permite elegir una meta y guardarla antes de pedir el nombre de usuario.
export default function OnboardGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { data: profile } = useMe();
  const savePreferences = useSaveOnboardingPreferences();
  const hasHydrated = useRef(false);
  const [goal, setGoal] = useState(12);
  const currentYear = new Date().getFullYear();
  const error = savePreferences.error
    ? toAppError(savePreferences.error).message
    : undefined;

  // Recupera la meta intermedia para continuar el onboarding después de reiniciar.
  useEffect(() => {
    if (!profile || hasHydrated.current) return;
    setGoal(profile.reading_goal ?? 12);
    hasHydrated.current = true;
  }, [profile]);

  // Guarda la meta antes del último paso sin borrar los géneros ya elegidos.
  function handleContinue() {
    if (savePreferences.isPending) return;

    savePreferences.mutate(
      {
        favoriteGenres: profile?.favorite_genres ?? [],
        readingGoal: goal,
      },
      { onSuccess: () => router.push("/(auth)/onboarding/username") },
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <OnboardHeader step={2} total={3} onBack={() => router.back()} />
      <View className="h-3" />
      <StepBar step={2} total={3} />

      <View className="px-6 mb-4">
        <Text className="font-display-sb text-text text-lg tracking-[-0.3px]">
          Tu meta para {currentYear}
        </Text>
        <Text className="font-body text-t2 text-sm mt-2">
          ¿Cuántos libros quieres leer este año? Puedes cambiarla cuando quieras.
        </Text>
      </View>

      <View className="flex-row items-center justify-center gap-7 mt-4 mb-9">
        <Pressable
          onPress={() => setGoal((current) => Math.max(1, current - 1))}
          className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Reducir meta"
        >
          <Text className="font-body-light text-text text-md leading-7">−</Text>
        </Pressable>

        <View className="items-center min-w-[120px]">
          <Text className="font-display-sb text-[88px] leading-[88px] tracking-[-4px] text-accent">
            {goal}
          </Text>
          <Text className="font-body text-t3 uppercase mt-1.5 text-[12px] tracking-[0.7px]">
            libros
          </Text>
        </View>

        <Pressable
          onPress={() => setGoal((current) => Math.min(365, current + 1))}
          className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Aumentar meta"
        >
          <Text className="font-body-light text-text text-md leading-7">+</Text>
        </Pressable>
      </View>

      <View className="flex-row justify-center gap-2">
        {QUICK_GOALS.map((quickGoal) => {
          const selectedGoal = goal === quickGoal;
          return (
            <Pressable
              key={quickGoal}
              onPress={() => setGoal(quickGoal)}
              className="py-[7px] px-[14px] rounded-full bg-surface border border-border"
              style={
                selectedGoal
                  ? {
                      borderColor: c.accent,
                      backgroundColor: alpha(c.accent, 0.14),
                    }
                  : undefined
              }
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedGoal }}
              accessibilityLabel={`${quickGoal} libros`}
            >
              <Text
                className={cn(
                  "font-body-md text-t2 text-[12px]",
                  selectedGoal && "text-accent",
                )}
              >
                {quickGoal}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="font-body text-t3 text-center mt-7 px-8 text-[12px] leading-[19px]">
        {getLabel(goal)}
      </Text>

      <View className="flex-1" />
      <View
        className="px-6 pt-5 border-t border-border/50"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        {error ? (
          <Text className="font-body text-error text-center mb-3 text-xs">
            {error}
          </Text>
        ) : null}
        <PrimaryButton loading={savePreferences.isPending} onPress={handleContinue}>
          Continuar
        </PrimaryButton>
      </View>
    </View>
  );
}
