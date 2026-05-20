import { KeyRound, Mail } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AuthField,
  BackBar,
  PrimaryButton,
  alpha,
} from "../../src/features/auth/components";
import { useColors } from "@/src/lib/colors";
import { useRequestResetPassword } from "@/src/features/auth/hooks/useResetPassword";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [email, setEmail] = useState("");

  const { mutate: request, isPending, error } = useRequestResetPassword();
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
            <KeyRound size={32} color={c.accent} />
          </View>
        </View>

        <View className="items-center mb-7 px-2">
          <Text className="font-display-sb text-text text-center text-2xl tracking-[-0.3px]">
            Recupera tu cuenta
          </Text>
          <Text className="font-body text-t2 text-sm mt-2.5 text-center leading-5">
            Ingresa tu correo y te enviaremos un código para restablecer tu
            contraseña.
          </Text>
        </View>

        <AuthField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={Mail}
        />
        {error && (
          <Text className="text-xs font-body text-center mb-3 text-error">
            {error.message}
          </Text>
        )}
        <View className="mt-[14px]">
          <PrimaryButton
            loading={isPending}
            onPress={() => request({ email })}
          >
            Enviar código
          </PrimaryButton>
        </View>

        <Link href="/(auth)/login" asChild>
          <Pressable className="pt-[18px] items-center">
            <Text className="font-body text-t2 text-sm">
              ¿Lo recordaste?{" "}
              <Text className="font-body-sb text-accent">
                Iniciar sesión
              </Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

