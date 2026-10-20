import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "~/stores/auth.store";
import { View } from "react-native";

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

// Limita el ancho de lectura de los formularios también al abrir Lexa en escritorio.
export default function AuthLayout() {
  return (
    <View className="flex-1 bg-bg items-center">
      <FlowGuard />
      <View style={{ flex: 1, width: "100%", maxWidth: 560 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}
