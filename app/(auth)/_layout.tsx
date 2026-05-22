import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "~/stores/auth.store";

function FlowGuard() {
  const isRecoveryMode = useAuthStore((s) => s.isRecoveryMode);
  const onboardingStarted = useAuthStore((s) => s.onboardingStarted);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const screen = (segments as string[])[1];

    if (screen === "new-password" && !isRecoveryMode) {
      router.replace("/(auth)/forgot-password");
      return;
    }

    if (screen === "onboarding" && !onboardingStarted) {
      router.replace("/(auth)/login");
    }
  }, [segments, isRecoveryMode, onboardingStarted]);

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
