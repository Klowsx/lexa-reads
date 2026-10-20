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

  const error = savePreferences.error
    ? toAppError(savePreferences.error).message
    : undefined;

  // Persiste el primer paso antes de avanzar para que el onboarding se pueda reanudar.
  function handleContinue(skip = false) {
    if (!profile || savePreferences.isPending) return;

    savePreferences.mutate(
      {
        favoriteGenres: skip ? (profile.favorite_genres ?? []) : selected,
        readingGoal: profile?.reading_goal ?? 12,
        nextStep: 2,
      },
      { onSuccess: () => router.push("/(auth)/onboarding/goal") },
    );
  }

  return (
    <OnboardingScreen step={1} title="¿Qué te gusta leer?"
      description="Elige los géneros que te llaman. Puedes saltar este paso y añadirlos después en tu perfil."
      busy={savePreferences.isPending || !profile} onSkip={() => handleContinue(true)}
      footer={<>
        <Text className="font-body text-t2 text-xs mb-4">{selected.length ? `${selected.length} géneros elegidos` : "Sin prisa: tus gustos pueden cambiar."}</Text>
        {error && <Text accessibilityLiveRegion="polite" className="font-body text-error text-xs mb-3">{error}</Text>}
        <PrimaryButton disabled={!profile} loading={savePreferences.isPending} onPress={() => handleContinue()}>Continuar</PrimaryButton>
      </>}
    >
      <View className="flex-row flex-wrap gap-2">
        {GENRES.map((genre) => {
          const selectedGenre = selected.includes(genre.id);
          return (
            <Pressable
              key={genre.id}
              onPress={() => toggle(genre.id)}
              disabled={savePreferences.isPending}
              className="min-h-11 justify-center py-2 px-[14px] rounded-full bg-surface border-[1.5px] border-border"
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
                )}
              >
                {selectedGenre ? "✓ " : ""}{genre.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}
