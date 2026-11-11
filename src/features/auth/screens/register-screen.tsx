import { useTranslation } from 'react-i18next'
import { Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { AuthField, PrimaryButton } from '~/features/auth/components'
import { useRegister } from '~/features/auth/hooks/useRegister'
import { useColors } from '~/theme/colors'
import { AuthPage } from '~/features/auth/components/auth-page'

// Recoge los datos de registro y muestra requisitos claros antes de crear una cuenta.
export default function RegisterScreen() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [terms, setTerms] = useState(false)
  const { mutate: register, isPending, error } = useRegister()
  const c = useColors()
  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)

  // Abre los documentos legales sin cambiar el estado de aceptación del formulario.
  function handleOpenLegal(path: string) {
    void Linking.openURL(`https://lexareads.app/${path}`)
  }

  return (
    <AuthPage
      centered={false}
      title={t('stitch.authUser.registerTitle')}
      description={t('stitch.authUser.registerIntro')}
    >
      <AuthField
        label={t('editProfile.name')}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
        icon={User}
      />
      <AuthField
        label={t('stitch.authUser.email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('stitch.authUser.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        autoComplete="email"
        icon={Mail}
      />
      <AuthField
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="new-password"
        icon={Lock}
        trailing={
          <Pressable
            onPress={() => setShowPassword((visible) => !visible)}
            className="w-12 h-12 -mr-3 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={
              showPassword
                ? t('changePasswordResult.hide')
                : t('changePasswordResult.show')
            }
          >
            {showPassword ? (
              <EyeOff size={16} color={c.t3} />
            ) : (
              <Eye size={16} color={c.t3} />
            )}
          </Pressable>
        }
      />

      <View className="mb-6 gap-2">
        <Text className="font-body text-t2 text-xs">
          {hasMinLength ? '✓' : '·'} {t('changePassword.reqMinChars')}
        </Text>
        <Text className="font-body text-t2 text-xs">
          {hasNumber ? '✓' : '·'} {t('stitch.authUser.numberPassword')}
        </Text>
      </View>

      <View className="mb-[22px]">
        <Pressable
          className="min-h-12 flex-row items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          onPress={() => setTerms((accepted) => !accepted)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: terms }}
          aria-checked={terms}
          accessibilityLabel={t('stitch.authUser.acceptLegal')}
        >
          <View
            className={`h-5 w-5 rounded-sm border-[1.5px] items-center justify-center ${terms ? 'bg-accent border-accent' : 'border-border'}`}
          >
            {terms && <Check size={11} color={c.onAccent} />}
          </View>
          <Text className="flex-1 text-xs text-t2 font-body">
            {t('stitch.authUser.legalStatement')}
          </Text>
        </Pressable>
        <View className="flex-row flex-wrap">
          {/* Los enlaces son controles separados para que abrirlos no marque la casilla. */}
          {[
            ['terms', t('stitch.authUser.terms')],
            ['eula', t('stitch.authUser.eula')],
            ['privacy', t('settings.privacy')],
            ['community', t('settings.communityGuidelines')]
          ].map(([path, label]) => (
            <Pressable
              key={path}
              onPress={() => handleOpenLegal(path)}
              accessibilityRole="link"
              accessibilityLabel={label}
              className="min-h-11 w-1/2 justify-center rounded-md px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Text className="font-body-sb text-sm text-text underline">
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="text-xs font-body text-center mb-3 text-error"
        >
          {error.message}
        </Text>
      )}

      <PrimaryButton
        disabled={
          !terms ||
          !name.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
          !hasMinLength ||
          !hasNumber
        }
        loading={isPending}
        onPress={() =>
          register({ email: email.trim(), displayName: name.trim(), password })
        }
      >
        {t('stitch.authUser.create')}
      </PrimaryButton>

      <Link href="/(auth)/login" replace asChild>
        <Pressable className="pt-[18px] items-center">
          <Text className="text-sm text-t2 font-body">
            {t('auth.alreadyHaveAccount')}{' '}
            <Text className="text-accent font-body-sb">{t('auth.login')}</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthPage>
  )
}
