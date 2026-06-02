import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const NEW_PW_REQUIREMENTS = [
  { label: 'Al menos 8 caracteres',  test: (pw: string) => pw.length >= 8 },
  { label: 'Contiene un número',      test: (pw: string) => /\d/.test(pw) },
  {
    label: 'Las contraseñas coinciden',
    test: (_: string, confirm: string) => _ !== '' && _ === confirm,
  },
];

function Field({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  trailing?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View className="mb-3.5">
      <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-md border border-border"
        style={{ backgroundColor: c.surface }}
      >
        <Lock size={15} color={c.t3} strokeWidth={1.8} style={{ marginLeft: 13 }} />
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          autoCapitalize="none"
          className="flex-1 font-body text-sm text-text"
          style={{ paddingHorizontal: 10, paddingVertical: 12 }}
          placeholderTextColor={c.t3}
        />
        {trailing ?? (
          <Pressable onPress={onToggleShow} hitSlop={8} style={{ paddingRight: 13 }}>
            {show
              ? <EyeOff size={16} color={c.t3} strokeWidth={1.8} />
              : <Eye size={16} color={c.t3} strokeWidth={1.8} />
            }
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const allMet =
    current.length >= 1 &&
    NEW_PW_REQUIREMENTS.every(({ test }) => test(newPw, confirm));

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight">
          Cambiar contraseña
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      >
        <Text className="text-sm font-body text-t2 mb-6">
          Ingresa tu contraseña actual y luego elige una nueva.
        </Text>

        {/* Contraseña actual */}
        <Field
          label="Contraseña actual"
          value={current}
          onChange={setCurrent}
          show={showCurrent}
          onToggleShow={() => setShowCurrent((s) => !s)}
        />

        <View className="h-px bg-border my-4" />

        {/* Nueva contraseña */}
        <Field
          label="Nueva contraseña"
          value={newPw}
          onChange={setNewPw}
          show={showNew}
          onToggleShow={() => setShowNew((s) => !s)}
        />

        {/* Confirmar */}
        <Field
          label="Confirmar nueva contraseña"
          value={confirm}
          onChange={setConfirm}
          show={showNew}
          onToggleShow={() => setShowNew((s) => !s)}
          trailing={
            newPw && newPw === confirm ? (
              <View style={{ paddingRight: 13 }}>
                <Check size={16} color={c.success} strokeWidth={2} />
              </View>
            ) : (
              <View style={{ width: 29 }} />
            )
          }
        />

        {/* Requirements */}
        <View
          className="rounded-xl border border-border mt-1 mb-6 p-3 gap-1"
          style={{ backgroundColor: c.sr }}
        >
          {NEW_PW_REQUIREMENTS.map(({ label, test }) => {
            const ok = test(newPw, confirm);
            return (
              <View key={label} className="flex-row items-center gap-2 py-1">
                {ok ? (
                  <View
                    className="w-4 h-4 rounded-full items-center justify-center"
                    style={{ backgroundColor: alpha(c.success, 0.18) }}
                  >
                    <Check size={10} color={c.success} strokeWidth={2.5} />
                  </View>
                ) : (
                  <View className="w-4 h-4 rounded-full bg-sh items-center justify-center">
                    <View className="w-1 h-1 rounded-full bg-t3" />
                  </View>
                )}
                <Text
                  className="font-body text-xs"
                  style={{ color: ok ? c.text : c.t2 }}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => router.back()}
          disabled={!allMet}
          className="py-3.5 rounded-md items-center"
          style={{ backgroundColor: allMet ? c.accent : alpha(c.accent, 0.4) }}
        >
          <Text className="text-sm font-body-sb text-white">Guardar contraseña</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
