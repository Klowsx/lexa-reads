import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { useAuthStore } from "~/stores/auth.store";
import { queryClient } from "~/lib/query-client";

function AuthGate() {
  const session = useAuthStore((s) => s.session);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [session, segments]);

  return null;
}

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
