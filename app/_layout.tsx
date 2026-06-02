import "../global.css";
import "~/lib/i18n";
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
import { AppState, Platform, View } from "react-native";
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

function AuthGate() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const onboardingStarted = useAuthStore((s) => s.onboardingStarted);
  const isRecoveryMode = useAuthStore((s) => s.isRecoveryMode);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup && !isRecoveryMode && !onboardingStarted) {
      router.replace("/(tabs)/feed");
    }
  }, [session, segments, isLoading, onboardingStarted, isRecoveryMode]);

  return null;
}

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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      else setRecoveryMode(false);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (Platform.OS !== "web") focusManager.setFocused(state === "active");
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded || isAuthLoading) return null;

  return (
    <View className={`flex-1${scheme === "dark" ? " dark" : ""}`}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <AuthGate />
          <ConsentModal />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </I18nextProvider>
    </View>
  );
}

export default RootLayout;
