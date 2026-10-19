import { Eye, EyeOff } from "lucide-react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthField, PrimaryButton } from "~/features/auth/components";
import { AuthPage } from "~/features/auth/components/auth-page";
import { useColors } from "~/theme/colors";
import { useLogin } from "~/features/auth/hooks/useLogin";

// Permite volver a la biblioteca con correo, contraseña y acceso directo a recuperación.
export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const c = useColors();
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { mutate: login, isPending, error } = useLogin();
  return (
    <AuthPage title="Vuelve a tu biblioteca" description="Tus lecturas, tus notas y la próxima historia que te espera.">
      <AuthField label="Correo" value={email} onChangeText={setEmail} placeholder="tu@correo.com" keyboardType="email-address" autoCapitalize="none" textContentType="username" autoComplete="email" />
      <AuthField label="Contraseña" value={password} onChangeText={setPassword} autoCapitalize="none" secureTextEntry={!showPw} textContentType="password" autoComplete="current-password"
        trailing={<Pressable onPress={() => setShowPw(!showPw)} className="w-11 h-11 -mr-3 items-center justify-center" accessibilityRole="button" accessibilityLabel={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPw ? <EyeOff size={20} color={c.text} /> : <Eye size={20} color={c.text} />}</Pressable>} />
      <Link href="/(auth)/forgot-password" asChild><Pressable className="min-h-11 self-end justify-center mb-4"><Text className="font-body-md text-text text-xs">¿Olvidaste tu contraseña?</Text></Pressable></Link>
      {error && <Text accessibilityLiveRegion="polite" className="font-body text-error text-xs mb-4">{error.message}</Text>}
      {error?.message === "Confirma tu correo antes de iniciar sesión" && <Link href={{ pathname: "/(auth)/confirm-email", params: { email: email.trim() } }} asChild><Pressable className="min-h-11 justify-center mb-3"><Text className="font-body-md text-text text-xs">Revisar o reenviar la confirmación</Text></Pressable></Link>}
      <PrimaryButton disabled={!email.trim() || !password} loading={isPending} onPress={() => login({ email: email.trim(), password })}>Iniciar sesión</PrimaryButton>
      <View className="flex-1 min-h-12" />
      <Text className="font-body text-t2 text-xs text-center">¿Tu primera vez en Lexa?</Text>
      <Link href="/(auth)/register" replace asChild><Pressable className="min-h-12 items-center justify-center"><Text className="font-body-sb text-text text-xs">Crear una cuenta</Text></Pressable></Link>
    </AuthPage>
  );
}
