import { useRouter } from 'expo-router'
import { ChevronLeft, Globe, Lock } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCreateClub } from '~/features/clubs/hooks/useCreateClub'
import type { ClubVisibility } from '~/features/clubs/clubs.queries'
import { useColors } from '~/theme/colors'
import { StitchFeedback } from '~/components/ui/StitchFeedback'
import { StitchSheet } from '~/components/ui/StitchSheet'
import { StitchButton } from '~/components/ui/StitchButton'
import { useStitchTheme } from '~/theme/stitch'

// Conserva el formulario existente y añade validación, recuperación y descarte explícito.
export default function NewClubScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const stitch = useStitchTheme()
  const posting = useRef(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<ClubVisibility>('public')
  const [discard, setDiscard] = useState(false)

  const create = useCreateClub()
  const canSubmit =
    name.trim().length >= 3 &&
    name.trim().length <= 100 &&
    description.length <= 500 &&
    !create.isPending

  // Solo abandona el formulario tras persistir y evita dobles creaciones antes del siguiente render.
  function submit() {
    if (!canSubmit || posting.current) return
    posting.current = true
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility
      },
      {
        onSuccess: ({ slug }) => router.replace(`/club/${slug}`),
        onSettled: () => {
          posting.current = false
        }
      }
    )
  }

  // Confirma la salida desde la cabecera si se ha empezado a completar el formulario.
  function close() {
    if (posting.current || create.isPending) return
    if (name || description || visibility !== 'public') setDiscard(true)
    else router.back()
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable
          hitSlop={8}
          onPress={close}
          disabled={create.isPending}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          Nuevo club
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase">
            Nombre
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Club de fantasía en español"
            placeholderTextColor={c.t3}
            maxLength={100}
            editable={!create.isPending}
            accessibilityLabel="Nombre del club"
            className="text-sm font-body text-text bg-sh border border-border rounded-md px-3 py-2.5"
          />
          <Text className="text-xs font-body text-t2">
            {t('clubStates.nameHint')} {name.length} / 100
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase">
            Descripción
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="¿De qué trata el club?"
            placeholderTextColor={c.t3}
            multiline
            maxLength={500}
            editable={!create.isPending}
            accessibilityLabel="Descripción del club"
            className="text-sm font-body text-text bg-sh border border-border rounded-md px-3 py-2.5 min-h-[90px]"
            style={{ textAlignVertical: 'top' }}
          />
          <Text className="text-xs font-body text-t2">
            {t('clubStates.descriptionHint')} {description.length} / 500
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase">
            Privacidad
          </Text>
          {(
            [
              {
                v: 'public',
                icon: Globe,
                title: 'Público',
                desc: 'Cualquiera puede encontrarlo y unirse al instante.'
              },
              {
                v: 'private',
                icon: Lock,
                title: 'Privado',
                desc: 'Solo por invitación; no aparece en búsqueda.'
              }
            ] as const
          ).map(({ v, icon: Icon, title, desc }) => {
            const sel = visibility === v
            return (
              <Pressable
                key={v}
                onPress={() => setVisibility(v)}
                disabled={create.isPending}
                className="flex-row items-start gap-3 p-3 rounded-md border"
                style={{
                  borderColor: sel ? c.accent : c.border,
                  backgroundColor: sel ? c.sh : 'transparent'
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
              >
                <Icon
                  size={18}
                  color={sel ? c.accent : c.t3}
                  strokeWidth={1.8}
                />
                <View className="flex-1">
                  <Text className="text-sm font-body-sb text-text">
                    {title}
                  </Text>
                  <Text className="text-xs font-body text-t2 mt-0.5">
                    {desc}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>

        {create.isError && (
          <StitchFeedback
            kind="error"
            title={t('clubStates.createError')}
            message={t('clubStates.createErrorHint')}
          />
        )}

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          className="py-3.5 rounded-md items-center bg-accent mt-2"
          style={{ opacity: canSubmit ? 1 : 0.4 }}
          accessibilityRole="button"
          accessibilityLabel="Crear club"
          accessibilityState={{ disabled: !canSubmit, busy: create.isPending }}
        >
          {create.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-sm font-body-sb text-white">Crear club</Text>
          )}
        </Pressable>
      </ScrollView>
      {discard && (
        <StitchSheet
          title={t('clubStates.discardTitle')}
          onClose={() => setDiscard(false)}
        >
          <Text
            style={{
              fontFamily: stitch.body,
              fontSize: 16,
              lineHeight: 24,
              color: stitch.secondary
            }}
          >
            {t('clubStates.discardHint')}
          </Text>
          <StitchButton
            label={t('clubStates.continueEditing')}
            onPress={() => setDiscard(false)}
          />
          <StitchButton
            label={t('clubStates.discard')}
            onPress={() => router.back()}
            destructive
          />
        </StitchSheet>
      )}
    </View>
  )
}
