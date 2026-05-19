import { Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BackBar,
  CodeInput,
  PrimaryButton,
  alpha,
} from '../../src/features/auth/components';
import { useColors } from '@/src/lib/colors';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [code] = useState('4729');

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <BackBar onBack={() => router.back()} />
      <View className="flex-1 px-6 pt-3" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="items-center mt-4 mb-[22px]">
          <View
            style={[styles.iconBg, { backgroundColor: alpha(c.accent, 0.12), borderColor: alpha(c.accent, 0.3) }]}
          >
            <Mail size={32} color={c.accent} />
          </View>
        </View>

        <View className="items-center mb-7 px-2">
          <Text className="font-display-sb text-text text-center" style={{ fontSize: 24, lineHeight: 30, letterSpacing: -0.3 }}>
            Revisa tu correo
          </Text>
          <Text className="font-body text-t2 text-sm mt-[10px] text-center" style={{ lineHeight: 20 }}>
            {'Enviamos un código de 6 dígitos a\n'}
            <Text className="font-body-md text-text">javier@email.com</Text>
          </Text>
        </View>

        <CodeInput value={code} />

        <Text className="font-body text-t3 text-center mt-[22px] mb-6" style={{ fontSize: 12 }}>
          ¿No recibiste el código? Reenviar en{' '}
          <Text className="font-body-md text-text">00:42</Text>
        </Text>

        <PrimaryButton disabled={code.length < 6}>Verificar</PrimaryButton>
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
