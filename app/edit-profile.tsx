import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useEffect, useState } from 'react'
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
import { getAvatarColor } from '~/lib/avatar'
import { cn } from '~/lib/utils'
import { useColors } from '~/theme/colors'
import { useMe } from '~/features/user/hooks/useMe'
import { useUpdateProfile } from '~/features/user/hooks/useUpdateProfile'

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`
}

const GENRES = [
  'Fantasía',
  'Realismo mágico',
  'Ciencia ficción',
  'Misterio',
  'Romance',
  'Dark Academia',
  'Clásicos',
  'Memorias',
  'Historia',
  'Thriller',
  'Poesía',
  'Horror'
]

export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const { data: me } = useMe()
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const color = me ? getAvatarColor(me.username) : c.accent

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    if (!me) return
    setName(me.display_name)
    setBio(me.bio ?? '')
    setSelectedGenres(me.favorite_genres ?? [])
    setIsPrivate(me.is_private ?? false)
  }, [me])

  const canSave = name.trim().length >= 2 && !isPending

  function toggleGenre(g: string) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

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
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          {t('editProfile.title')}
        </Text>
        <Pressable hitSlop={8} onPress={handleSave} disabled={!canSave}>
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
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Avatar */}
        {me && (
          <View
            className="items-center py-6 border-b border-border"
            style={{ backgroundColor: alpha(color, 0.04) }}
          >
            <Avatar
              displayName={me.display_name}
              username={me.username}
              avatarUrl={me.avatar_url}
              size={80}
            />
            <Pressable className="mt-3 px-4 py-2 rounded-md bg-sh border border-border">
              <Text className="text-xs font-body-md text-text">
                {t('editProfile.changePhoto')}
              </Text>
            </Pressable>
            <Text className="text-xs font-body text-t3 mt-1.5">
              {t('editProfile.photoHint')}
            </Text>
          </View>
        )}

        <View className="px-5 pt-6">
          {/* Nombre */}
          <View className="mb-4">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
              {t('editProfile.name')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={50}
              className="rounded-md border border-border font-body text-sm text-text bg-surface px-[14px] py-[11px]"
              placeholderTextColor={c.t3}
            />
          </View>

          {/* Bio */}
          <View className="mb-6">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
              {t('editProfile.bio')}
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={160}
              placeholder={t('editProfile.bioPlaceholder')}
              className="rounded-md border border-border font-body text-sm text-text bg-surface px-[14px] py-[11px] leading-[22px]"
              style={{
                textAlignVertical: 'top'
              }}
              placeholderTextColor={c.t3}
            />
            <Text className="text-xs font-body text-t3 text-right mt-1">
              {bio.length}/160
            </Text>
          </View>

          {/* Géneros favoritos */}
          <View className="mb-6">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-2">
              {t('editProfile.favoriteGenres')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {GENRES.map((g) => {
                const active = selectedGenres.includes(g)
                return (
                  <Pressable
                    key={g}
                    onPress={() => toggleGenre(g)}
                    className="px-3 py-1.5 rounded-full border bg-sh border-border"
                    style={
                      active
                        ? {
                            backgroundColor: alpha(color, 0.14),
                            borderColor: color
                          }
                        : undefined
                    }
                  >
                    <Text
                      className="text-xs font-body text-t2"
                      style={active ? { color } : undefined}
                    >
                      {g}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Cuenta privada */}
          <View className="flex-row items-center justify-between py-3.5 border-t border-border mb-8">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-body-md text-text">
                {t('editProfile.privateAccount')}
              </Text>
              <Text className="text-xs font-body text-t3 mt-0.5">
                {t('editProfile.privateAccountSub')}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: c.border, true: c.accent }}
              thumbColor="#fff"
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={cn(
              'py-3.5 rounded-md items-center mb-2 bg-accent',
              canSave ? 'opacity-100' : 'opacity-50'
            )}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-sm font-body-sb text-white">
                {t('common.saveChanges')}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
