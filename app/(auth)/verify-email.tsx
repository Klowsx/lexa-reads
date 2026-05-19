import { Mail } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BackBar,
  CodeInput,
  PrimaryButton,
  alpha,
} from "../../src/features/auth/components";
import { useColors } from "@/src/lib/colors";
import { useVerifyPasswordResetCode } from "@/src/features/auth/hooks/useResetPassword";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [code, setCode] = useState("");

  const { email } = useLocalSearchParams<{ email: string }>();
  const inputRef = useRef<TextInput>(null);
  const {
    mutate: verifiyCode,
    isPending,
    error,
  } = useVerifyPasswordResetCode();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <BackBar onBack={() => router.back()} />
      <View
        className="flex-1 px-6 pt-3"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="items-center mt-4 mb-[22px]">
          <View
            className="w-[72px] h-[72px] rounded-[20px] items-center justify-center border"
            style={{
              backgroundColor: alpha(c.accent, 0.12),
              borderColor: alpha(c.accent, 0.3),
            }}
          >
            <Mail size={32} color={c.accent} />
          </View>
        </View>

        <View className="items-center mb-7 px-2">
          <Text className="font-display-sb text-text text-center text-2xl leading-[30px] tracking-[-0.3px]">
            Revisa tu correo
          </Text>
          <Text className="font-body text-t2 text-sm mt-[10px] text-center leading-5">
            {"Enviamos un código de 6 dígitos a\n"}
            <Text className="font-body-md text-text">{email}</Text>
          </Text>
        </View>

        <Pressable onPress={() => inputRef.current?.focus()}>
          <CodeInput value={code} />
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            className="absolute opacity-0 w-full h-full"
          />
        </Pressable>

        <Text className="font-body text-t3 text-center mt-[22px] mb-6 text-xs">
          ¿No recibiste el código? Reenviar en{" "}
          <Text className="font-body-md text-text">00:42</Text>
        </Text>

        <PrimaryButton
          disabled={code.length < 6 || isPending}
          onPress={() => verifiyCode({ email, token: code })}
        >
          {isPending ? "Verificando" : "Verificar"}
        </PrimaryButton>
      </View>
    </View>
  );
}
