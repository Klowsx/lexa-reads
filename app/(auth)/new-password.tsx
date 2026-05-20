import { Check, Eye, EyeOff, Lock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useUpdatePassword } from "@/src/features/auth/hooks/useResetPassword";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AuthField,
  BackBar,
  PrimaryButton,
  alpha,
} from "../../src/features/auth/components";
import { useColors } from "@/src/lib/colors";

const REQUIREMENTS = [
  { label: "Al menos 8 caracteres", test: (pw: string) => pw.length >= 8 },
  { label: "Contiene un número", test: (pw: string) => /\d/.test(pw) },
  {
    label: "Las contraseñas coinciden",
    test: (_: string, pw2: string) => _ !== "" && _ === pw2,
  },
];

export default function NewPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const { mutate: updatePassword, isPending, error } = useUpdatePassword();

  const allMet = REQUIREMENTS.every(({ test }) => test(password, confirm));

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <BackBar onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-7">
          <Text className="font-display-sb text-text text-2xl tracking-[-0.3px]">
            Nueva contraseña
          </Text>
          <Text className="font-body text-t2 text-sm mt-2.5">
            Elige una contraseña fuerte y única.
          </Text>
        </View>

        <AuthField
          label="Nueva contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          autoCapitalize="none"
          icon={Lock}
          trailing={
            <Pressable onPress={() => setShow(!show)} hitSlop={8}>
              {show ? (
                <EyeOff size={16} color={c.t3} />
              ) : (
                <Eye size={16} color={c.t3} />
              )}
            </Pressable>
          }
        />

        <AuthField
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!show}
          autoCapitalize="none"
          icon={Lock}
          trailing={
            password && password === confirm ? (
              <Check size={16} color={c.success} />
            ) : undefined
          }
        />

        <View className="rounded-[10px] bg-sr border border-border mt-1 mb-[22px] p-3 gap-1">
          {REQUIREMENTS.map(({ label, test }) => {
            const ok = test(password, confirm);
            return (
              <View key={label} className="flex-row items-center gap-2 py-1">
                {ok ? (
                  <View
                    className="w-4 h-4 rounded-full items-center justify-center"
                    style={{ backgroundColor: alpha(c.success, 0.18) }}
                  >
                    <Check size={10} color={c.success} />
                  </View>
                ) : (
                  <View className="w-4 h-4 rounded-full bg-sh items-center justify-center">
                    <View className="w-1 h-1 rounded-full bg-t3" />
                  </View>
                )}
                <Text
                  className={`font-body text-xs ${ok ? "text-text" : "text-t2"}`}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {error && (
          <Text className="font-body text-error text-xs text-center mb-3">
            {error.message}
          </Text>
        )}
        <PrimaryButton
          disabled={!allMet}
          loading={isPending}
          onPress={() => updatePassword({ password })}
        >
          Guardar contraseña
        </PrimaryButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

