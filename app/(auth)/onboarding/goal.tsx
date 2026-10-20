import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  PrimaryButton,
  alpha,
} from "../../../src/features/auth/components";
import { useSaveOnboardingPreferences } from "~/features/auth/hooks/useOnboarding";
import { useMe } from "~/features/user/hooks/useMe";
import { cn } from "~/lib/utils";
import { useColors } from "~/theme/colors";
import { toAppError } from "~/types";
import { OnboardingScreen } from "~/features/auth/components/onboarding-screen";

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
  return `Aprox. ${perMonth} libros al mes, ${pace}.`;
}

// Permite elegir una meta y guardarla antes de pedir el nombre de usuario.
export default function OnboardGoalScreen() {
  const router = useRouter();
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
  function handleContinue(skip = false) {
    if (!profile || savePreferences.isPending) return;

    savePreferences.mutate(
      {
        favoriteGenres: profile?.favorite_genres ?? [],
        readingGoal: skip ? (profile.reading_goal ?? 12) : goal,
        nextStep: 3,
      },
      { onSuccess: () => router.push("/(auth)/onboarding/username") },
    );
  }

  return (
    <OnboardingScreen step={2} title={`Tu ritmo para ${currentYear}`}
      description={`Una meta que te acompañe. Si saltas este paso, conservaremos ${profile?.reading_goal ?? 12} libros como punto de partida. Puedes cambiarla en Ajustes.`}
      onBack={() => router.replace("/(auth)/onboarding/genres")}
      onSkip={() => handleContinue(true)} busy={savePreferences.isPending || !profile}
      footer={<>
        {error && <Text accessibilityLiveRegion="polite" className="font-body text-error text-xs mb-3">{error}</Text>}
        <PrimaryButton disabled={!profile} loading={savePreferences.isPending} onPress={() => handleContinue()}>Guardar meta</PrimaryButton>
      </>}
    >

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
          <Text className="font-display-sb text-[64px] leading-[76px] text-text">
            {goal}
          </Text>
          <Text className="font-body text-t2 mt-1.5 text-xs">
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

      <View className="flex-row flex-wrap justify-center gap-2">
        {QUICK_GOALS.map((quickGoal) => {
          const selectedGoal = goal === quickGoal;
          return (
            <Pressable
              key={quickGoal}
              onPress={() => setGoal(quickGoal)}
              className="min-h-11 justify-center py-2 px-[14px] rounded-full bg-surface border border-border"
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
                  "font-body-md text-t2 text-xs",
                  selectedGoal && "text-text",
                )}
              >
                {quickGoal}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="font-body text-t2 text-center mt-7 text-xs leading-6">
        {getLabel(goal)}
      </Text>

    </OnboardingScreen>
  );
}
