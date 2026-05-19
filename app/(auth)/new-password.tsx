import { Check, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AUTH,
  AuthField,
  BackBar,
  PrimaryButton,
  alpha,
} from '../../src/features/auth/components';

const REQUIREMENTS = [
  { label: 'Al menos 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { label: 'Contiene un número', test: (pw: string) => /\d/.test(pw) },
  { label: 'Las contraseñas coinciden', test: (_: string, pw2: string) => _ !== '' && _ === pw2 },
];

export default function NewPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('NuevaContrasena24');
  const [confirm, setConfirm] = useState('NuevaContrasena24');
  const [show, setShow] = useState(false);

  const allMet = REQUIREMENTS.every(({ test }) => test(password, confirm));

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackBar onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Elige una contraseña fuerte y única.</Text>
        </View>

        <AuthField
          label="Nueva contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          autoCapitalize="none"
          icon={<Lock size={16} color={AUTH.t3} />}
          trailing={
            <Pressable onPress={() => setShow(!show)} hitSlop={8}>
              {show ? <EyeOff size={16} color={AUTH.t3} /> : <Eye size={16} color={AUTH.t3} />}
            </Pressable>
          }
        />

        <AuthField
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!show}
          autoCapitalize="none"
          icon={<Lock size={16} color={AUTH.t3} />}
          trailing={
            password && password === confirm ? (
              <Check size={16} color="#5CAF7E" />
            ) : undefined
          }
        />

        {/* Requirements checklist */}
        <View style={styles.checklist}>
          {REQUIREMENTS.map(({ label, test }) => {
            const ok = test(password, confirm);
            return (
              <View key={label} style={styles.checkItem}>
                <View style={[styles.checkDot, ok && styles.checkDotOk]}>
                  {ok ? (
                    <Check size={10} color="#5CAF7E" />
                  ) : (
                    <View style={styles.dot} />
                  )}
                </View>
                <Text style={[styles.checkLabel, ok && styles.checkLabelOk]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <PrimaryButton disabled={!allMet}>Guardar contraseña</PrimaryButton>
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
    marginBottom: 28,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 28,
    color: AUTH.text,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: AUTH.t2,
    marginTop: 10,
    fontFamily: 'DMSans_400Regular',
  },
  checklist: {
    backgroundColor: AUTH.sr,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: AUTH.border,
    marginTop: 4,
    marginBottom: 22,
    gap: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AUTH.sh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDotOk: {
    backgroundColor: alpha('#5CAF7E', 0.18),
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AUTH.t3,
  },
  checkLabel: {
    fontSize: 12,
    color: AUTH.t2,
    fontFamily: 'DMSans_400Regular',
  },
  checkLabelOk: {
    color: AUTH.text,
  },
});
