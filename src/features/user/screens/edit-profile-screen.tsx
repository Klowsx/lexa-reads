import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar } from '~/components/ui/Avatar'
import { normalizeProfileGenres, PROFILE_GENRES } from '../profile-genres'
import { cn } from '~/lib/utils'
import { useColors } from '~/theme/colors'
import { useMe } from '~/features/user/hooks/useMe'
import { useUpdateProfile } from '~/features/user/hooks/useUpdateProfile'

// Edita los campos reales del perfil y conserva el borrador mientras se guarda.
export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const { data: me } = useMe()
  const { mutate: updateProfile, isPending, isError } = useUpdateProfile()

  const hydratedUser = useRef<string | null>(null)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    if (!me || hydratedUser.current === me.id) return
    hydratedUser.current = me.id
    setName(me.display_name)
    setBio(me.bio ?? '')
    setSelectedGenres(normalizeProfileGenres(me.favorite_genres))
    setIsPrivate(me.is_private ?? false)
  }, [me])

  const canSave = !!me && name.trim().length >= 2 && !isPending

  // Alterna un identificador canónico sin guardar etiquetas traducidas.
  function toggleGenre(g: string) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  // Guarda la identidad y privacidad antes de volver al perfil.
  function handleSave() {
    if (!canSave) return
    updateProfile(
      {
        display_name: name.trim(),
        bio: bio.trim() || null,
        favorite_genres: selectedGenres.length > 0 ? selectedGenres : null,
        is_private: isPrivate
      },
      { onSuccess: () => router.back() }
    )
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable
          className="h-12 w-12 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          {t('editProfile.title')}
        </Text>
        <Pressable
          className="min-h-12 min-w-12 items-center justify-center"
          accessibilityRole="button"
          onPress={handleSave}
          disabled={!canSave}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <Text
              className={cn(
                'text-sm font-body-sb',
                canSave ? 'text-accent' : 'text-t3'
              )}
            >
              {t('common.save')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 24) + 24,
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center'
        }}
      >
        {/* Avatar */}
        {me && (
          <View className="items-center py-6 bg-sr">
            <Avatar
              displayName={me.display_name}
              username={me.username}
              avatarUrl={me.avatar_url}
              size={80}
            />
            <Text className="font-display-sb text-lg text-text mt-3">
              {me.display_name}
            </Text>
            <Text className="font-body text-sm text-t2 mt-1">
              @{me.username}
            </Text>
          </View>
        )}

        <View className="px-5 pt-6">
          {/* Nombre */}
          <View className="mb-4">
            <Text className="text-sm font-body-sb text-text mb-1.5">
              {t('editProfile.name')}
            </Text>
            <TextInput
              editable={!isPending}
              accessibilityLabel={t('editProfile.name')}
              value={name}
              onChangeText={setName}
              maxLength={50}
              className="rounded-md font-body text-base text-text bg-surface min-h-14 px-4 py-3"
              placeholderTextColor={c.t3}
            />
          </View>

          {/* Bio */}
          <View className="mb-6">
            <Text className="text-sm font-body-sb text-text mb-1.5">
              {t('editProfile.bio')}
            </Text>
            <TextInput
              editable={!isPending}
              accessibilityLabel={t('editProfile.bio')}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={300}
              placeholder={t('editProfile.bioPlaceholder')}
              className="rounded-md font-body text-base text-text bg-surface min-h-14 px-4 py-3 leading-[22px]"
              style={{
                textAlignVertical: 'top'
              }}
              placeholderTextColor={c.t3}
            />
            <Text className="text-xs font-body text-t3 text-right mt-1">
              {bio.length}/300
            </Text>
          </View>

          {/* Géneros favoritos */}
          <View className="mb-6">
            <Text className="text-sm font-body-sb text-text mb-2">
              {t('editProfile.favoriteGenres')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {PROFILE_GENRES.map((g) => {
                const active = selectedGenres.includes(g)
                return (
                  <Pressable
                    key={g}
                    disabled={isPending}
                    onPress={() => toggleGenre(g)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    className="min-h-12 justify-center px-4 py-2 rounded-full bg-surface"
                    style={
                      active
                        ? {
                            backgroundColor: c.accent
                          }
                        : undefined
                    }
                  >
                    <Text
                      className="text-xs font-body text-t2"
                      style={active ? { color: c.onAccent } : undefined}
                    >
                      {t(`profileGenres.${g}`, { defaultValue: g })}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Cuenta privada */}
          <View className="flex-row items-center justify-between p-4 rounded-card bg-sr mb-8">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-body-md text-text">
                {t('editProfile.privateAccount')}
              </Text>
              <Text className="text-xs font-body text-t3 mt-0.5">
                {t('editProfile.privateAccountSub')}
              </Text>
            </View>
            <Switch
              disabled={isPending}
              accessibilityLabel={t('editProfile.privateAccount')}
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: c.border, true: c.accent }}
              thumbColor="#fff"
            />
          </View>

          {isError ? (
            <Text
              accessibilityRole="alert"
              className="font-body text-sm text-error mb-3"
            >
              {t('editProfile.saveError')}
            </Text>
          ) : null}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={cn(
              'min-h-12 py-3.5 rounded-md items-center mb-2 bg-accent',
              canSave ? 'opacity-100' : 'opacity-50'
            )}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={c.onAccent} />
            ) : (
              <Text
                className="text-sm font-body-sb"
                style={{ color: c.onAccent }}
              >
                {t('common.saveChanges')}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
