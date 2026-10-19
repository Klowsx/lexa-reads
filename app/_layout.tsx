import "../global.css";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useEffect } from "react";
import { ActivityIndicator, AppState, Platform, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { useFonts } from "expo-font";
import { supabase } from "~/lib/supabase";
import { useAuthStore } from "~/stores/auth.store";
import { useThemeStore } from "~/stores/theme.store";
import { queryClient } from "~/lib/query-client";
import i18n from "~/lib/i18n";
import { ConsentModal } from "~/features/user/components/ConsentModal";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { useMe } from "~/features/user/hooks/useMe";
import { getOnboardingRoute } from "~/features/auth/onboarding-route";
import { PrimaryButton, GhostButton } from "~/features/auth/components";
import { useLogout } from "~/features/auth/hooks/useLogout";
import { useColors } from "~/theme/colors";

// Dirige la sesión según el estado persistido del perfil y no según un flag temporal del cliente.
function AuthGate() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isRecoveryMode = useAuthStore((s) => s.isRecoveryMode);
  const segments = useSegments();
  const router = useRouter();
  const { data: profile, isPending: isProfilePending, isError: hasProfileError, refetch, isFetching } = useMe();
  const logout = useLogout();
  const c = useColors();

  useEffect(() => {
    if (isLoading) return;

    const routeSegments = segments as string[];
    const inAuthGroup = routeSegments[0] === "(auth)";
    const inOnboarding = inAuthGroup && routeSegments[1] === "onboarding";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)");
      return;
    }

    if (!session || isRecoveryMode || isProfilePending || hasProfileError) return;

    if (profile?.onboarding_completed && inAuthGroup) {
      router.replace("/(tabs)/feed");
    } else if (!profile?.onboarding_completed && !inOnboarding) {
      if (profile) router.replace(getOnboardingRoute(profile));
    }
  }, [session, segments, isLoading, isRecoveryMode, profile, isProfilePending, hasProfileError, router]);

  if (session && !isRecoveryMode && (isProfilePending || hasProfileError)) {
    return (
      <View className="absolute inset-0 bg-bg items-center justify-center px-6" style={{ zIndex: 10 }}>
        <View style={{ width: "100%", maxWidth: 440 }}>
          {hasProfileError ? <>
            <Text className="font-display-sb text-text text-lg mb-4">Tu biblioteca sigue aquí</Text>
            <Text className="font-body text-t2 text-xs mb-6">No pudimos cargar tu perfil. Revisa tu conexión y vuelve a intentarlo.</Text>
            <PrimaryButton loading={isFetching} onPress={() => void refetch()}>Volver a intentar</PrimaryButton>
            <GhostButton disabled={logout.isPending} onPress={() => logout.mutate()}><Text className="font-body text-text text-xs">Usar otra cuenta</Text></GhostButton>
            {logout.error && <Text className="font-body text-error text-xs">No pudimos cerrar la sesión. Inténtalo de nuevo.</Text>}
          </> : <>
            <ActivityIndicator color={c.text} />
            <Text accessibilityLiveRegion="polite" className="font-body text-t2 text-xs text-center mt-4">Preparando tu biblioteca…</Text>
          </>}
        </View>
      </View>
    );
  }
  return null;
}

// Inicializa sesión, fuentes y proveedores globales de la aplicación.
function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setRecoveryMode = useAuthStore((s) => s.setRecoveryMode);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const scheme = useThemeStore((s) => s.scheme);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      else if (event === "SIGNED_OUT") setRecoveryMode(false);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading, setRecoveryMode]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (Platform.OS !== "web") focusManager.setFocused(state === "active");
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded || isAuthLoading) return null;

  return (
    <View className={`flex-1${scheme === "dark" ? " dark" : ""}`}>
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <AuthGate />
            <ConsentModal />
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </View>
  );
}

export default RootLayout;
