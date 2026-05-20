import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "~/stores/auth.store";

function FlowGuard() {
  const session = useAuthStore((s) => s.session);
  const onboardingStarted = useAuthStore((s) => s.onboardingStarted);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const screen = (segments as string[])[1];

    // verify-email solo es válido si viene con el param email (via router.push desde forgot-password)
    // Si no hay param en la URL, segments no ayuda — la protección real es new-password
    // new-password solo es válido si hay una recovery session activa
    if (screen === "new-password") {
      const isRecoverySession = (session?.user as any)?.amr?.some(
        (e: { method: string }) => e.method === "recovery"
      );
      if (!isRecoverySession) {
        router.replace("/(auth)/forgot-password");
        return;
      }
    }

    // onboarding solo es accesible después de registrarse
    if (screen === "onboarding" && !onboardingStarted) {
      router.replace("/(auth)/login");
    }
  }, [segments, session, onboardingStarted]);

  return null;
}

export default function AuthLayout() {
  return (
    <>
      <FlowGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
