import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateReport } from '~/features/user/hooks/useCreateReport';
import type { ReportTargetType } from '~/features/user/user.queries';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const REASONS: { id: string; label: string }[] = [
  { id: 'spam',          label: 'Spam o publicidad' },
  { id: 'inappropriate', label: 'Contenido inapropiado' },
  { id: 'harassment',    label: 'Acoso o intimidación' },
  { id: 'false_info',    label: 'Información falsa' },
  { id: 'hate_speech',   label: 'Discurso de odio' },
  { id: 'other',         label: 'Otro' },
];

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
  onClose: () => void;
}

export function ReportSheet({ targetType, targetId, targetName, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const report = useCreateReport();

  async function handleSubmit() {
    if (!selected) return;
    await report.mutateAsync(
      { targetType, targetId, reason: selected, details },
      { onSuccess: () => setSubmitted(true) },
    );
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/[0.55]"
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute bottom-0 left-0 right-0"
      >
        <View
          className="rounded-t-xl border-t border-border bg-surface"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {/* Handle */}
          <View className="items-center pt-2.5 pb-1">
            <View className="w-9 h-1 rounded-full bg-border" />
          </View>

          {submitted ? (
            <View className="items-center px-6 py-8 gap-3">
              <Text className="text-lg font-display-sb text-text">Reporte enviado</Text>
              <Text className="text-xs font-body text-t2 text-center leading-[20px]">
                Gracias por tu reporte. Nuestro equipo lo revisará en menos de 24 horas.
              </Text>
              <Pressable
                onPress={onClose}
                className="mt-2 py-2.5 px-8 rounded-md bg-accent"
              >
                <Text className="text-xs font-body-sb text-white">Cerrar</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            >
              <Text className="font-display-sb text-md text-text mb-0.5 pt-1">
                Reportar {targetType === 'user' ? 'usuario' : 'contenido'}
              </Text>
              {targetName && (
                <Text className="text-xs font-body text-t2 mb-4">{targetName}</Text>
              )}

              <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase mb-2">
                Motivo
              </Text>

              {REASONS.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => setSelected(r.id)}
                  className="flex-row items-center gap-3 py-3 border-b border-border"
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: selected === r.id ? c.accent : c.border,
                      backgroundColor: selected === r.id ? alpha(c.accent, 0.15) : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected === r.id && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: c.accent,
                        }}
                      />
                    )}
                  </View>
                  <Text className="text-xs font-body text-text">{r.label}</Text>
                </Pressable>
              ))}

              <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase mt-4 mb-2">
                Detalles adicionales (opcional)
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Describe el problema..."
                placeholderTextColor={c.t3}
                multiline
                numberOfLines={3}
                className="text-xs font-body text-text bg-sr border border-border rounded-md p-[10px] min-h-[72px]"
                style={{ textAlignVertical: 'top' }}
              />

              <View className="flex-row gap-2 mt-4">
                <Pressable
                  onPress={onClose}
                  className="flex-1 py-3 rounded-md items-center border border-border bg-sh"
                >
                  <Text className="text-xs font-body-md text-text">Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!selected || report.isPending}
                  className="flex-1 py-3 rounded-md items-center"
                  style={{ backgroundColor: selected ? c.accent : alpha(c.accent, 0.35) }}
                >
                  {report.isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text className="text-xs font-body-sb text-white">
                        Enviar reporte
                      </Text>
                  }
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
