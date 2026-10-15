import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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

const GENRES = [
  { id: "fantasia", label: "Fantasía" },
  { id: "realismo", label: "Realismo mágico" },
  { id: "dark", label: "Dark Academia" },
  { id: "romance", label: "Romance" },
  { id: "misterio", label: "Misterio" },
  { id: "scifi", label: "Ciencia ficción" },
  { id: "memorias", label: "Memorias" },
  { id: "ensayo", label: "Ensayo" },
  { id: "clasico", label: "Clásicos" },
  { id: "historico", label: "Histórico" },
  { id: "poesia", label: "Poesía" },
  { id: "terror", label: "Terror" },
];

// Permite elegir géneros y guardar este primer paso antes de continuar.
export default function OnboardGenresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { data: profile } = useMe();
  const savePreferences = useSaveOnboardingPreferences();
  const hasHydrated = useRef(false);
  const [selected, setSelected] = useState<string[]>([]);

  // Recupera los géneros guardados si la persona cerró la aplicación antes de terminar.
  useEffect(() => {
    if (!profile || hasHydrated.current) return;
    setSelected(profile.favorite_genres ?? []);
    hasHydrated.current = true;
  }, [profile]);

  // Añade o quita un género de la selección actual.
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((genre) => genre !== id)
        : [...current, id],
    );
  }

  const enough = selected.length >= 3;
  const error = savePreferences.error
    ? toAppError(savePreferences.error).message
    : undefined;

  // Persiste el primer paso antes de avanzar para que el onboarding se pueda reanudar.
  function handleContinue() {
    if (!enough || savePreferences.isPending) return;

    savePreferences.mutate(
      {
        favoriteGenres: selected,
        readingGoal: profile?.reading_goal ?? 12,
      },
      { onSuccess: () => router.push("/(auth)/onboarding/goal") },
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <OnboardHeader step={1} total={3} />
      <View className="h-3" />
      <StepBar step={1} total={3} />

      <View className="px-6 mb-4">
        <Text className="font-display-sb text-text text-lg tracking-[-0.3px]">
          ¿Qué te gusta leer?
        </Text>
        <Text className="font-body text-t2 text-sm mt-2">
          Elige al menos 3 géneros. Personalizaremos tus recomendaciones.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {GENRES.map((genre) => {
          const selectedGenre = selected.includes(genre.id);
          return (
            <Pressable
              key={genre.id}
              onPress={() => toggle(genre.id)}
              className="py-[10px] px-[14px] rounded-full bg-surface border-[1.5px] border-border"
              style={
                selectedGenre
                  ? {
                      borderColor: c.accent,
                      backgroundColor: alpha(c.accent, 0.14),
                    }
                  : undefined
              }
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selectedGenre }}
              accessibilityLabel={genre.label}
            >
              <Text
                className={cn(
                  "font-body-md text-sm",
                  selectedGenre ? "text-text" : "text-t2",
                  selectedGenre && "text-accent",
                )}
              >
                {genre.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        className="px-6 pt-5 border-t border-border/50"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Text className="font-body text-t3 text-center mb-3 text-xs">
          {selected.length} de 3 mínimo seleccionados
        </Text>
        {error ? (
          <Text className="font-body text-error text-center mb-3 text-xs">
            {error}
          </Text>
        ) : null}
        <PrimaryButton
          disabled={!enough}
          loading={savePreferences.isPending}
          onPress={handleContinue}
        >
          Continuar
        </PrimaryButton>
      </View>
    </View>
  );
}
