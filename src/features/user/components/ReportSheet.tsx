import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCreateReport } from '~/features/user/hooks/useCreateReport'
import type { ReportTargetType } from '~/features/user/user.queries'
import { useColors } from '~/theme/colors'

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`
}

const REASONS: { id: string; labelKey: string }[] = [
  { id: 'spam', labelKey: 'report.reasonSpam' },
  { id: 'inappropriate', labelKey: 'report.reasonInappropriate' },
  { id: 'harassment', labelKey: 'report.reasonHarassment' },
  { id: 'false_info', labelKey: 'report.reasonFalse' },
  { id: 'hate_speech', labelKey: 'report.reasonHate' },
  { id: 'other', labelKey: 'report.reasonOther' }
]

interface Props {
  targetType: ReportTargetType
  targetId: string
  targetName?: string
  onClose: () => void
}

export function ReportSheet({
  targetType,
  targetId,
  targetName,
  onClose
}: Props) {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const report = useCreateReport()

  async function handleSubmit() {
    // Conserva el formulario cuando falla y solo confirma después de persistir el reporte.
    if (!selected) return
    try {
      await report.mutateAsync({
        targetType,
        targetId,
        reason: selected,
        details
      })
      setSubmitted(true)
    } catch {
      // El estado de la mutación muestra un error recuperable sin borrar el borrador.
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/[0.55]" onPress={onClose} />
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
              <Text className="text-lg font-display-sb text-text">
                {t('report.sent')}
              </Text>
              <Text className="text-xs font-body text-t2 text-center leading-[20px]">
                {t('report.sentBody')}
              </Text>
              <Pressable
                onPress={onClose}
                className="mt-2 py-2.5 px-8 rounded-md bg-accent"
              >
                <Text className="text-xs font-body-sb text-white">
                  {t('common.close')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 8
              }}
            >
              <Text className="font-display-sb text-md text-text mb-0.5 pt-1">
                {targetType === 'user'
                  ? t('report.reportUser')
                  : t('report.reportContent')}
              </Text>
              {targetName && (
                <Text className="text-xs font-body text-t2 mb-4">
                  {targetName}
                </Text>
              )}

              <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase mb-2">
                {t('report.reason')}
              </Text>

              {REASONS.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => setSelected(r.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={t(r.labelKey)}
                  accessibilityState={{ selected: selected === r.id }}
                  className="flex-row items-center gap-3 py-3 border-b border-border"
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: selected === r.id ? c.accent : c.border,
                      backgroundColor:
                        selected === r.id
                          ? alpha(c.accent, 0.15)
                          : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {selected === r.id && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: c.accent
                        }}
                      />
                    )}
                  </View>
                  <Text className="text-xs font-body text-text">
                    {t(r.labelKey)}
                  </Text>
                </Pressable>
              ))}

              <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase mt-4 mb-2">
                {t('report.details')}
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder={t('report.detailsPlaceholder')}
                placeholderTextColor={c.t3}
                multiline
                numberOfLines={3}
                maxLength={1000}
                className="text-xs font-body text-text bg-sr border border-border rounded-md p-[10px] min-h-[72px]"
                style={{ textAlignVertical: 'top' }}
              />

              <View className="flex-row gap-2 mt-4">
                <Pressable
                  onPress={onClose}
                  className="flex-1 py-3 rounded-md items-center border border-border bg-sh"
                >
                  <Text className="text-xs font-body-md text-text">
                    {t('common.cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!selected || report.isPending}
                  className="flex-1 py-3 rounded-md items-center"
                  style={{
                    backgroundColor: selected ? c.accent : alpha(c.accent, 0.35)
                  }}
                >
                  {report.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-xs font-body-sb text-white">
                      {t('report.submit')}
                    </Text>
                  )}
                </Pressable>
              </View>
              {report.isError && (
                <Text
                  accessibilityRole="alert"
                  className="mt-3 text-xs font-body text-error"
                >
                  {t('report.submitError')}
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
