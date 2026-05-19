import { KeyRound, Mail } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUTH,
  AuthField,
  BackBar,
  PrimaryButton,
  alpha,
} from '../../src/features/auth/components';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('javier@email.com');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackBar onBack={() => router.back()} />
      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Lock icon */}
        <View style={styles.iconWrap}>
          <View style={[styles.iconBg, { backgroundColor: alpha(AUTH.accent, 0.12) }]}>
            <KeyRound size={32} color={AUTH.accent} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>Recupera tu cuenta</Text>
          <Text style={styles.subtitle}>
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
          icon={<Mail size={16} color={AUTH.t3} />}
        />

        <View style={styles.btnWrapper}>
          <PrimaryButton>Enviar código</PrimaryButton>
        </View>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.loginBtn}>
            <Text style={styles.loginText}>
              ¿Lo recordaste?{' '}
              <Text style={styles.loginAccent}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  iconWrap: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 22,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: alpha(AUTH.accent, 0.3),
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 24,
    color: AUTH.text,
    lineHeight: 30,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: AUTH.t2,
    marginTop: 10,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
  },
  btnWrapper: {
    marginTop: 14,
  },
  loginBtn: {
    paddingTop: 18,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: AUTH.t2,
    fontFamily: 'DMSans_400Regular',
  },
  loginAccent: {
    color: AUTH.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
});
