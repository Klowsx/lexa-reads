import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "~/stores/auth.store";

// Protege rutas de autenticación cuyo acceso depende de una sesión o recuperación activa.
function FlowGuard() {
  const isRecoveryMode = useAuthStore((s) => s.isRecoveryMode);
  const session = useAuthStore((s) => s.session);
  const segments = useSegments();
  const router = useRouter();

  // Evita acceder a la recuperación y al onboarding sin una sesión válida.
  useEffect(() => {
    const screen = (segments as string[])[1];

    if (screen === "new-password" && !isRecoveryMode) {
      router.replace("/(auth)/forgot-password");
      return;
    }

    if (screen === "onboarding" && !session) {
      router.replace("/(auth)/login");
    }
  }, [segments, isRecoveryMode, router, session]);

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
