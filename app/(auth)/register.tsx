import { Check, Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AUTH,
  AuthField,
  BackBar,
  PrimaryButton,
  alpha,
} from "../../src/features/auth/components";
import { useRegister } from "@/src/features/auth/hooks/useRegister";
import { AppError } from "@/src/types";

const STRENGTH_LEVELS = [
  { label: "Débil", color: "#C43A3A" },
  { label: "Buena", color: "#C49A20" },
  { label: "Fuerte", color: "#5CAF7E" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);

  const { mutate: register, isPending, error } = useRegister();

  const strengthIdx = password.length < 6 ? 0 : password.length < 10 ? 1 : 2;
  const strengthFill = Math.min(password.length / 12, 1) * 3;
  const { label: strengthLabel, color: strengthColor } =
    STRENGTH_LEVELS[strengthIdx];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <BackBar onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>
            Empieza a construir tu biblioteca.
          </Text>
        </View>

        <AuthField
          label="Nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          icon={<User size={16} color={AUTH.t3} />}
        />
        <AuthField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Mail size={16} color={AUTH.t3} />}
        />
        <AuthField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          icon={<Lock size={16} color={AUTH.t3} />}
          trailing={
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
            >
              {showPassword ? (
                <EyeOff size={16} color={AUTH.t3} />
              ) : (
                <Eye size={16} color={AUTH.t3} />
              )}
            </Pressable>
          }
        />

        {/* Strength meter */}
        <View style={styles.strengthMeter}>
          <View style={styles.strengthBars}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.strengthBar,
                  strengthFill > i && { backgroundColor: strengthColor },
                ]}
              />
            ))}
          </View>
          <Text style={styles.strengthLabel}>
            Seguridad:{" "}
            <Text style={[styles.strengthValue, { color: strengthColor }]}>
              {strengthLabel}
            </Text>
          </Text>
        </View>

        {/* Terms */}
        <Pressable style={styles.termsRow} onPress={() => setTerms(!terms)}>
          <View style={[styles.checkbox, terms && styles.checkboxChecked]}>
            {terms && <Check size={11} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            Acepto los <Text style={styles.termsLink}>Términos</Text> y la{" "}
            <Text style={styles.termsLink}>Política de privacidad</Text> de
            Lexa.
          </Text>
        </Pressable>

        {error && (
          <Text className="text-red-600 text-sm mb-12 items-center">
            {(error as AppError).message}
          </Text>
        )}

        <PrimaryButton
          disabled={!terms || isPending}
          onPress={() => register({ email, displayName: name, password })}
        >
          {isPending ? "Creando cuenta" : "Crear cuenta"}
        </PrimaryButton>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.loginBtn}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{" "}
              <Text style={styles.loginAccent}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 28,
    color: AUTH.text,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH.t2,
    marginTop: 8,
    fontFamily: "DMSans_400Regular",
  },
  strengthMeter: {
    marginTop: -6,
    marginBottom: 18,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 5,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 100,
    backgroundColor: AUTH.sh,
  },
  strengthLabel: {
    fontSize: 11,
    color: AUTH.t3,
    fontFamily: "DMSans_400Regular",
  },
  strengthValue: {
    fontFamily: "DMSans_600SemiBold",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 22,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: AUTH.border,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: AUTH.accent,
    borderColor: AUTH.accent,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: AUTH.t2,
    lineHeight: 18,
    fontFamily: "DMSans_400Regular",
  },
  termsLink: {
    color: AUTH.accent,
  },
  loginBtn: {
    paddingTop: 18,
    alignItems: "center",
  },
  loginText: {
    fontSize: 13,
    color: AUTH.t2,
    fontFamily: "DMSans_400Regular",
  },
  loginAccent: {
    color: AUTH.accent,
    fontFamily: "DMSans_600SemiBold",
  },
});
