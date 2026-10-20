import { Check, X } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar } from '~/components/ui/Avatar'
import { PrimaryButton } from '~/features/auth/components/PrimaryButton'
import { useColors } from '~/theme/colors'
import type { UserProfile } from '~/types/user'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { normalizeProfileGenres, PROFILE_GENRES } from '../profile-genres'

interface Props {
  user: UserProfile
  onClose: () => void
}

export function EditProfileSheet({ user, onClose }: Props) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { mutate: updateProfile, isPending, isError } = useUpdateProfile()
  const [name, setName] = useState(user.display_name)
  const [bio, setBio] = useState(user.bio ?? '')
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    normalizeProfileGenres(user.favorite_genres)
  )
  const [focusedField, setFocusedField] = useState<'name' | 'bio' | null>(null)

  function handleSave() {
    if (isPending || !name.trim()) return
    updateProfile(
      {
        display_name: name.trim(),
        bio: bio.trim() || null,
        favorite_genres: selectedGenres.length ? selectedGenres : null
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal
      visible
      transparent
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={isPending ? undefined : onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          onPress={onClose}
          disabled={isPending}
          accessible={false}
          importantForAccessibility="no"
          className="absolute inset-0 bg-black/60"
        />
        <View
          accessibilityViewIsModal
          className="w-full max-w-[720px] self-center rounded-t-card bg-bg overflow-hidden"
          style={{
            maxHeight: '92%',
            paddingBottom: Math.max(insets.bottom, 12)
          }}
        >
          <View className="flex-row items-center justify-between gap-3 px-container py-3 border-b border-border">
            <Text
              accessibilityRole="header"
              className="flex-1 font-display-sb text-lg text-text"
            >
              {t('editProfile.title')}
            </Text>
            <Pressable
              onPress={onClose}
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              accessibilityState={{ disabled: isPending }}
              className="min-w-11 min-h-11 rounded-md items-center justify-center active:bg-sr"
              style={{ opacity: isPending ? 0.5 : 1 }}
            >
              <X size={22} color={c.text} strokeWidth={1.6} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ padding: 18, gap: 24 }}
          >
            <View className="flex-row items-center gap-3">
              <Avatar
                displayName={name || user.display_name}
                username={user.username}
                avatarUrl={user.avatar_url}
                size={56}
                neutral
              />
              <Text className="flex-1 font-body text-xs text-t2">
                @{user.username}
              </Text>
            </View>
            <View className="gap-2">
              <Text
                nativeID="profile-name-label"
                className="font-body-sb text-xs text-text"
              >
                {t('editProfile.name')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={50}
                editable={!isPending}
                accessibilityLabel={t('editProfile.name')}
                accessibilityLabelledBy="profile-name-label"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                className="rounded-md bg-surface text-text font-body text-sm px-3 py-3 min-h-12"
                style={{
                  borderWidth: 2,
                  borderColor: focusedField === 'name' ? c.accent : c.border
                }}
                placeholderTextColor={c.t2}
              />
            </View>
            <View className="gap-2">
              <Text
                nativeID="profile-bio-label"
                className="font-body-sb text-xs text-text"
              >
                {t('editProfile.bio')}
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                maxLength={160}
                editable={!isPending}
                accessibilityLabel={t('editProfile.bio')}
                accessibilityLabelledBy="profile-bio-label"
                placeholder={t('editProfile.bioPlaceholder')}
                placeholderTextColor={c.t2}
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
                className="rounded-md bg-surface text-text font-body text-sm px-3 py-3"
                style={{
                  minHeight: 112,
                  textAlignVertical: 'top',
                  borderWidth: 2,
                  borderColor: focusedField === 'bio' ? c.accent : c.border
                }}
              />
              <Text className="font-body text-xs text-t2 text-right">
                {bio.length}/160
              </Text>
            </View>
            <View className="gap-3">
              <Text className="font-body-sb text-xs text-text">
                {t('editProfile.favoriteGenres')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {Array.from(
                  new Set([...PROFILE_GENRES, ...selectedGenres])
                ).map((genre) => {
                  const active = selectedGenres.includes(genre)
                  return (
                    <Pressable
                      key={genre}
                      disabled={isPending}
                      onPress={() =>
                        setSelectedGenres((prev) =>
                          prev.includes(genre)
                            ? prev.filter((item) => item !== genre)
                            : [...prev, genre]
                        )
                      }
                      accessibilityRole="checkbox"
                      accessibilityLabel={t(`profileGenres.${genre}`, {
                        defaultValue: genre
                      })}
                      accessibilityState={{
                        checked: active,
                        disabled: isPending
                      }}
                      aria-checked={active}
                      aria-disabled={isPending}
                      className="min-h-11 flex-row items-center gap-2 px-3 py-2 rounded-full border active:opacity-70"
                      style={{
                        backgroundColor: active ? c.sr : 'transparent',
                        borderColor: active ? c.text : c.border
                      }}
                    >
                      {active ? (
                        <Check size={16} color={c.text} strokeWidth={1.8} />
                      ) : null}
                      <Text className="font-body text-xs text-text">
                        {t(`profileGenres.${genre}`, { defaultValue: genre })}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </ScrollView>
          <View className="px-container pt-3 border-t border-border gap-3">
            {isError ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                className="font-body text-xs text-text"
              >
                {t('editProfile.saveError')}
              </Text>
            ) : null}
            <PrimaryButton
              onPress={handleSave}
              disabled={!name.trim()}
              loading={isPending}
            >
              {t('common.saveChanges')}
            </PrimaryButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
