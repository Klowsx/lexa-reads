import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AuthPage } from "~/features/auth/components/auth-page";
import { PrimaryButton } from "~/features/auth/components/PrimaryButton";
import { useResendConfirmation } from "~/features/auth/hooks/use-resend-confirmation";
import { useResendCountdown } from "~/features/auth/hooks/use-resend-countdown";

// Explica la confirmación de una cuenta nueva y permite reenviar sin perder el contexto.
export default function ConfirmEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const resend = useResendConfirmation();
  const countdown = useResendCountdown();
  return (
    <AuthPage title="Un último vistazo al correo" description="Abre el enlace de confirmación que enviamos. Después, vuelve a Lexa e inicia sesión para preparar tu biblioteca.">
      <View className="bg-surface rounded-md p-5 mb-6">
        <Text className="font-body text-t2 text-xs mb-2">Correo de tu cuenta</Text>
        <Text selectable className="font-body-md text-text text-xs">{email || "Vuelve al registro para indicar tu correo."}</Text>
      </View>
      <Link href={{ pathname: "/(auth)/login", params: { email } }} replace asChild>
        <PrimaryButton>Ya confirmé, iniciar sesión</PrimaryButton>
      </Link>
      <Pressable accessibilityRole="button" disabled={!email || countdown.seconds > 0 || resend.isPending}
        className="min-h-12 items-center justify-center mt-3"
        onPress={() => resend.mutate(email, { onSuccess: countdown.restart })}>
        <Text className="font-body-md text-t2 text-xs">{resend.isPending ? "Reenviando…" : countdown.seconds > 0 ? `Reenviar en ${countdown.seconds} s` : "Reenviar confirmación"}</Text>
      </Pressable>
      {resend.error && <Text accessibilityLiveRegion="polite" className="font-body text-error text-xs mt-3">{resend.error.message}</Text>}
      {resend.isSuccess && <Text accessibilityLiveRegion="polite" className="font-body text-text text-xs mt-3">Solicitud enviada. Revisa también la carpeta de correo no deseado.</Text>}
      <View className="flex-1 min-h-8" />
      <Link href="/(auth)/register" replace asChild><Pressable className="min-h-12 items-center justify-center"><Text className="font-body text-text text-xs">¿Correo equivocado? Volver al registro</Text></Pressable></Link>
    </AuthPage>
  );
}
