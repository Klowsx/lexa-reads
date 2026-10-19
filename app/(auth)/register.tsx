import { Check, Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
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
} from "../../src/features/auth/components";
import { useRegister } from "@/src/features/auth/hooks/useRegister";
import { useColors } from "~/theme/colors";

// Recoge los datos de registro y muestra requisitos claros antes de crear una cuenta.
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);

  const { mutate: register, isPending, error } = useRegister();
  const c = useColors();

  const strengthLevels = [
    { label: "Débil", color: c.error },
    { label: "Buena", color: c.warning },
    { label: "Fuerte", color: c.success },
  ];

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const strengthScore = [hasMinLength, hasNumber, password.length >= 12].filter(Boolean).length;
  const strengthIdx = password.length === 0 ? 0 : Math.max(0, strengthScore - 1);
  const strengthFill = password.length === 0 ? 0 : strengthScore;
  const { label: strengthLabel, color: strengthColor } =
    strengthLevels[strengthIdx];

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
        <View className="mb-6">
          <Text className="font-display-sb text-2xl text-text tracking-tight">
            Crea tu cuenta
          </Text>
          <Text className="font-body text-sm text-t2 mt-2">
            Empieza a construir tu biblioteca.
          </Text>
        </View>

        <AuthField
          label="Nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          icon={User}
        />
        <AuthField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoComplete="email"
          icon={Mail}
        />
        <AuthField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          textContentType="newPassword"
          autoComplete="new-password"
          icon={Lock}
          trailing={
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="w-11 h-11 -mr-3 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeOff size={16} color={c.t3} />
              ) : (
                <Eye size={16} color={c.t3} />
              )}
            </Pressable>
          }
        />

        {/* Strength meter */}
        <View className="-mt-1.5 mb-[18px]">
          <View className="flex-row gap-1 mb-1">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className="flex-1 h-[3px] rounded-full bg-sh"
                style={
                  strengthFill > i
                    ? { backgroundColor: strengthColor }
                    : undefined
                }
              />
            ))}
          </View>
          <Text className="text-xs text-t3 font-body">
            Seguridad:{" "}
            <Text className="font-body-sb" style={{ color: strengthColor }}>
              {strengthLabel}
            </Text>
          </Text>
        </View>

        {/* Terms */}
        <Pressable
          className="flex-row items-start gap-2.5 mb-[22px]"
          onPress={() => setTerms(!terms)}
        >
          <View
            className={`w-[18px] h-[18px] rounded-sm border-[1.5px] mt-0.5 items-center justify-center ${terms ? "bg-accent border-accent" : "border-border"}`}
          >
            {terms && <Check size={11} color={c.onAccent} />}
          </View>
          <Text className="flex-1 text-xs text-t2 leading-[18px] font-body">
            Acepto los{" "}
            <Text
              className="text-accent"
              onPress={() => Linking.openURL('https://lexareads.app/terms')}
            >
              Términos
            </Text>
            ,{" "}
            <Text
              className="text-accent"
              onPress={() => Linking.openURL('https://lexareads.app/eula')}
            >
              la Licencia de uso
            </Text>
            {" "}y la{" "}
            <Text
              className="text-accent"
              onPress={() => Linking.openURL('https://lexareads.app/privacy')}
            >
              Política de privacidad
            </Text>
            , y me comprometo a respetar las{" "}
            <Text
              className="text-accent"
              onPress={() => Linking.openURL('https://lexareads.app/community')}
            >
              Normas de la comunidad
            </Text>
            : Lexa tiene tolerancia cero con el contenido ofensivo y los usuarios abusivos.
          </Text>
        </Pressable>

        {error && (
          <Text className="text-xs font-body text-center mb-3 text-error">
            {error.message}
          </Text>
        )}

        <PrimaryButton
          disabled={!terms}
          loading={isPending}
          onPress={() => register({ email, displayName: name, password })}
        >
          Crear cuenta
        </PrimaryButton>

        <Link href="/(auth)/login" asChild>
          <Pressable className="pt-[18px] items-center">
            <Text className="text-sm text-t2 font-body">
              ¿Ya tienes cuenta?{" "}
              <Text className="text-accent font-body-sb">Iniciar sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
