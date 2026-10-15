import { Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AuthField,
  OnboardHeader,
  PrimaryButton,
  StepBar,
  alpha,
} from "../../../src/features/auth/components";
import {
  normalizeUsername,
  useCompleteOnboarding,
  useUsernameAvailability,
} from "~/features/auth/hooks/useOnboarding";
import { useDebounce } from "~/lib/useDebounce";
import { useColors } from "~/theme/colors";

// Pide el nombre público y cierra el onboarding cuando el servidor confirma todos los datos.
export default function OnboardUsernameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [username, setUsername] = useState("");
  const debouncedUsername = useDebounce(username, 350);
  const availability = useUsernameAvailability(debouncedUsername);
  const completeOnboarding = useCompleteOnboarding();
  const validFormat = /^[a-z0-9_]{3,30}$/.test(username);
  const isAvailable = availability.data === true;
  const usernameError = !username
    ? undefined
    : !validFormat
      ? "Usa de 3 a 30 letras, números o guion bajo."
      : availability.isError
        ? "No pudimos comprobar el nombre. Inténtalo de nuevo."
        : availability.data === false
          ? "Este nombre ya está en uso."
          : undefined;
  const completionError = completeOnboarding.error as {
    code?: string;
    message?: string;
  } | null;
  const completionMessage =
    completionError?.code === "23505"
      ? "Este nombre acaba de ser elegido. Prueba otro."
      : completionError?.message;

  // Normaliza el valor antes de comprobarlo para que la vista previa y la base usen el mismo nombre.
  function handleChange(value: string) {
    if (completeOnboarding.error) completeOnboarding.reset();
    setUsername(normalizeUsername(value));
  }

  // Cierra el onboarding en el servidor y entra a la aplicación solo después de persistirlo.
  function handleComplete() {
    if (!validFormat || !isAvailable || completeOnboarding.isPending) return;

    completeOnboarding.mutate(username, {
      onSuccess: () => router.replace("/(tabs)/feed"),
    });
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <OnboardHeader step={3} total={3} onBack={() => router.back()} allowSkip={false} />
      <View className="h-3" />
      <StepBar step={3} total={3} />

      <View className="px-6 mb-6">
        <Text className="font-display-sb text-text text-lg tracking-[-0.3px]">
          {"Elige tu nombre\nde lector"}
        </Text>
        <Text className="font-body text-t2 text-sm mt-2">
          Así te encontrarán otros lectores en Lexa.
        </Text>
      </View>

      <View className="px-6">
        <View className="self-center mb-7 relative">
          <View
            className="w-[92px] h-[92px] rounded-full items-center justify-center border-2"
            style={{ backgroundColor: alpha(c.accent, 0.18), borderColor: c.accent }}
          >
            <Text className="font-body-sb text-[34px] text-accent">
              {username.slice(0, 2).toUpperCase() || "··"}
            </Text>
          </View>
        </View>

        <AuthField
          label="Nombre de usuario"
          value={username}
          onChangeText={handleChange}
          autoCapitalize="none"
          autoComplete="username-new"
          textContentType="username"
          icon={<Text className="font-body-md text-t3 text-[14px]">@</Text>}
          trailing={
            isAvailable && !availability.isFetching ? (
              <Check size={16} color={c.success} />
            ) : undefined
          }
          error={usernameError}
        />

        <Text className="font-body text-t3 -mt-2 ml-0.5 text-[11px]">
          lexa.app/@
          <Text className="text-text">{username || "tu_nombre"}</Text>
        </Text>
      </View>

      <View className="flex-1" />
      <View className="px-6 pt-5" style={{ paddingBottom: insets.bottom + 24 }}>
        {completionMessage ? (
          <Text className="font-body text-error text-center mb-3 text-xs">
            {completionMessage}
          </Text>
        ) : null}
        <PrimaryButton
          disabled={!validFormat || !isAvailable || availability.isFetching}
          loading={completeOnboarding.isPending}
          onPress={handleComplete}
        >
          Entrar a Lexa
        </PrimaryButton>
      </View>
    </View>
  );
}
