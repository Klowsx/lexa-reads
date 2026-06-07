import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
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
  GhostButton,
  PrimaryButton,
  GoogleIcon,
} from "../../src/features/auth/components";
import { useColors } from "~/theme/colors";
import { useLogin } from "@/src/features/auth/hooks/useLogin";
import { useOAuthLogin } from "@/src/features/auth/hooks/useOAuthLogin";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const { mutate: login, isPending, error } = useLogin();
  const { mutate: oauthLogin, isPending: isOAuthPending } = useOAuthLogin();

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
          <Text className="font-display-sb text-text text-2xl">
            {"Bienvenido\nde vuelta"}
          </Text>
          <Text className="font-body text-t2 text-sm mt-[10px]">
            Continúa donde lo dejaste.
          </Text>
        </View>

        <AuthField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="username"
          autoComplete="email"
          icon={Mail}
        />
        <AuthField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPw}
          textContentType="password"
          autoComplete="current-password"
          icon={Lock}
          trailing={
            <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
              {showPw ? (
                <EyeOff size={16} color={c.t3} />
              ) : (
                <Eye size={16} color={c.t3} />
              )}
            </Pressable>
          }
        />

        <View className="items-end -mt-1 mb-[22px]">
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable>
              <Text className="font-body-md text-xs text-accent">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </Link>
        </View>

        {error && (
          <Text className="text-xs font-body text-center mb-3 text-error">
            {error.message}
          </Text>
        )}

        <PrimaryButton
          loading={isPending}
          onPress={() => login({ email, password })}
        >
          Iniciar sesión
        </PrimaryButton>

        <View className="flex-row items-center gap-[10px] my-[22px]">
          <View className="flex-1 h-px bg-border" />
          <Text
            className="font-body text-xs text-t3 uppercase tracking-[0.9px]"
          >
            o continúa con
          </Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        <View className="flex-row mb-2">
          <View className="w-[10px]" />
          <GhostButton
            loading={isOAuthPending}
            onPress={() => oauthLogin("google")}
          >
            <GoogleIcon />
            <Text className="font-body-md text-text text-sm">Google</Text>
          </GhostButton>
        </View>

        <View className="flex-1" />

        <Link href="/(auth)/register" asChild>
          <Pressable className="pt-[18px] items-center">
            <Text className="font-body text-t2 text-sm">
              ¿No tienes cuenta?{" "}
              <Text className="font-body-sb text-accent">Crear una</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


