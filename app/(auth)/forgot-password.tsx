import { KeyRound, Mail } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthField,
  BackBar,
  PrimaryButton,
  alpha,
} from '../../src/features/auth/components';
import { useColors } from '@/src/lib/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [email, setEmail] = useState('javier@email.com');

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <BackBar onBack={() => router.back()} />
      <View className="flex-1 px-6 pt-3" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="items-center mt-4 mb-[22px]">
          <View
            style={[styles.iconBg, { backgroundColor: alpha(c.accent, 0.12), borderColor: alpha(c.accent, 0.3) }]}
          >
            <KeyRound size={32} color={c.accent} />
          </View>
        </View>

        <View className="items-center mb-7 px-2">
          <Text className="font-display-sb text-text text-center" style={{ fontSize: 24, lineHeight: 30, letterSpacing: -0.3 }}>
            Recupera tu cuenta
          </Text>
          <Text className="font-body text-t2 text-sm mt-[10px] text-center" style={{ lineHeight: 20 }}>
            Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.
          </Text>
        </View>

        <AuthField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Mail size={16} color={c.t3} />}
        />

        <View className="mt-[14px]">
          <PrimaryButton>Enviar código</PrimaryButton>
        </View>

        <Link href="/(auth)/login" asChild>
          <Pressable className="pt-[18px] items-center">
            <Text className="font-body text-t2 text-sm">
              ¿Lo recordaste?{' '}
              <Text className="font-body-sb" style={{ color: c.accent }}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
