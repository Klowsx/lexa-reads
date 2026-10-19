import { Mail } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BackBar,
  CodeInput,
  PrimaryButton,
  alpha,
} from "../../src/features/auth/components";
import { useColors } from "~/theme/colors";
import {
  useVerifyPasswordResetCode,
  useRequestResetPassword,
} from "@/src/features/auth/hooks/useResetPassword";

const RESEND_SECONDS = 60;

// Verifica el código de recuperación y ofrece un reenvío con tiempo visible.
export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const { email } = useLocalSearchParams<{ email: string }>();
  const inputRef = useRef<TextInput>(null);

  const {
    mutate: verifyCode,
    isPending,
    error,
  } = useVerifyPasswordResetCode();

  const { mutate: resend, isPending: isResending } = useRequestResetPassword();

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // Reinicia el contador solo después de solicitar otro código para el correo actual.
  const handleResend = () => {
    resend({ email });
    setCode("");
    setCountdown(RESEND_SECONDS);
  };

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <BackBar onBack={() => router.back()} />
      <View
        className="flex-1 px-6 pt-3"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="items-center mt-4 mb-[22px]">
          <View
            className="w-18 h-18 rounded-lg items-center justify-center border"
            style={{
              backgroundColor: alpha(c.accent, 0.12),
              borderColor: alpha(c.accent, 0.3),
            }}
          >
            <Mail size={32} color={c.accent} />
          </View>
        </View>

        <View className="items-center mb-7 px-2">
          <Text className="font-display-sb text-text text-center text-2xl tracking-[-0.3px]">
            Revisa tu correo
          </Text>
          <Text className="font-body text-t2 text-sm mt-2.5 text-center leading-5">
            {"Enviamos un código de 6 dígitos a\n"}
            <Text className="font-body-md text-text">{email}</Text>
          </Text>
        </View>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          accessibilityRole="button"
          accessibilityLabel="Ingresar código de verificación de seis dígitos"
        >
          <CodeInput value={code} />
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            className="absolute opacity-0 w-full h-full"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            accessibilityLabel="Código de verificación"
          />
        </Pressable>

        {error && (
          <Text className="font-body text-error text-xs text-center mt-3" accessibilityLiveRegion="polite">
            {error.message}
          </Text>
        )}

        <View className="items-center mt-[22px] mb-6">
          {countdown > 0 ? (
            <Text className="font-body text-t3 text-center text-xs">
              ¿No recibiste el código? Reenviar en {" "}
              <Text className="font-body-md text-text">
                {mm}:{ss}
              </Text>
            </Text>
          ) : (
            <Pressable
              onPress={handleResend}
              disabled={isResending}
              className="min-h-11 justify-center"
              accessibilityRole="button"
              accessibilityLabel="Reenviar código"
              accessibilityState={{ disabled: isResending, busy: isResending }}
            >
              <Text className="font-body-sb text-accent text-xs">
                {isResending ? "Reenviando…" : "Reenviar código"}
              </Text>
            </Pressable>
          )}
        </View>

        <PrimaryButton
          disabled={code.length < 6}
          loading={isPending}
          onPress={() => verifyCode({ email, token: code })}
        >
          Verificar
        </PrimaryButton>
      </View>
    </View>
  );
}
