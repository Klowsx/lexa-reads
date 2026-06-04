import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { cn } from '~/lib/utils';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const NEW_PW_REQUIREMENTS = [
  { labelKey: 'changePassword.reqMinChars', test: (pw: string) => pw.length >= 8 },
  { labelKey: 'changePassword.reqNumber',   test: (pw: string) => /\d/.test(pw) },
  {
    labelKey: 'changePassword.reqMatch',
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
        className="flex-row items-center rounded-md border border-border bg-surface"
      >
        <Lock size={15} color={c.t3} strokeWidth={1.8} className="ml-[13px]" />
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          autoCapitalize="none"
          className="flex-1 font-body text-sm text-text px-[10px] py-3"
          placeholderTextColor={c.t3}
        />
        {trailing ?? (
          <Pressable onPress={onToggleShow} hitSlop={8} className="pr-[13px]">
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
  const { t } = useTranslation();

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
          {t('changePassword.title')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      >
        <Text className="text-sm font-body text-t2 mb-6">
          {t('changePassword.intro')}
        </Text>

        {/* Contraseña actual */}
        <Field
          label={t('changePassword.current')}
          value={current}
          onChange={setCurrent}
          show={showCurrent}
          onToggleShow={() => setShowCurrent((s) => !s)}
        />

        <View className="h-px bg-border my-4" />

        {/* Nueva contraseña */}
        <Field
          label={t('changePassword.new')}
          value={newPw}
          onChange={setNewPw}
          show={showNew}
          onToggleShow={() => setShowNew((s) => !s)}
        />

        {/* Confirmar */}
        <Field
          label={t('changePassword.confirm')}
          value={confirm}
          onChange={setConfirm}
          show={showNew}
          onToggleShow={() => setShowNew((s) => !s)}
          trailing={
            newPw && newPw === confirm ? (
              <View className="pr-[13px]">
                <Check size={16} color={c.success} strokeWidth={2} />
              </View>
            ) : (
              <View className="w-[29px]" />
            )
          }
        />

        {/* Requirements */}
        <View
          className="rounded-xl border border-border mt-1 mb-6 p-3 gap-1 bg-sr"
        >
          {NEW_PW_REQUIREMENTS.map(({ labelKey, test }) => {
            const ok = test(newPw, confirm);
            return (
              <View key={labelKey} className="flex-row items-center gap-2 py-1">
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
                  className={cn("font-body text-xs", ok ? "text-text" : "text-t2")}
                >
                  {t(labelKey)}
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => router.back()}
          disabled={!allMet}
          className={cn("py-3.5 rounded-md items-center", allMet ? "bg-accent" : "")}
          style={allMet ? undefined : { backgroundColor: alpha(c.accent, 0.4) }}
        >
          <Text className="text-sm font-body-sb text-white">{t('changePassword.save')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
