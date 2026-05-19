import { Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUTH,
  BackBar,
  CodeInput,
  PrimaryButton,
  alpha,
} from '../../src/features/auth/components';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [code] = useState('4729');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackBar onBack={() => router.back()} />
      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Mail icon */}
        <View style={styles.iconWrap}>
          <View style={[styles.iconBg, { backgroundColor: alpha(AUTH.accent, 0.12) }]}>
            <Mail size={32} color={AUTH.accent} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>Revisa tu correo</Text>
          <Text style={styles.subtitle}>
            {'Enviamos un código de 6 dígitos a\n'}
            <Text style={styles.emailHighlight}>javier@email.com</Text>
          </Text>
        </View>

        <CodeInput value={code} />

        <Text style={styles.resend}>
          ¿No recibiste el código? Reenviar en{' '}
          <Text style={styles.resendTimer}>00:42</Text>
        </Text>

        <PrimaryButton disabled={code.length < 6}>Verificar</PrimaryButton>
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
  emailHighlight: {
    color: AUTH.text,
    fontFamily: 'DMSans_500Medium',
  },
  resend: {
    fontSize: 12,
    color: AUTH.t3,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 24,
    fontFamily: 'DMSans_400Regular',
  },
  resendTimer: {
    color: AUTH.text,
    fontFamily: 'DMSans_500Medium',
  },
});
