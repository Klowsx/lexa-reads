import { useTranslation } from 'react-i18next'
import { Link } from 'expo-router'
import { BookOpen, Compass, Users } from 'lucide-react-native'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookFan, PrimaryButton, Wordmark } from '~/features/auth/components'
import { useColors } from '~/theme/colors'

// Recibe a lectores nuevos y habituales con dos destinos claros antes de personalizar el perfil.
export default function WelcomeScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const c = useColors()
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center'
      }}
    >
      <View className="items-center gap-2 mb-6">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-sr mb-1">
          <Text className="font-display-sb text-2xl text-text italic">L</Text>
        </View>
        <Wordmark size={30} />
        <Text className="font-body-sb text-xs text-t2 tracking-widest">
          {t('stitch.authUser.readingCommunity')}
        </Text>
      </View>
      <View className="rounded-card bg-sr overflow-hidden mb-6">
        {/* Las cubiertas locales evitan el recuadro vacío de la imagen oscura de referencia. */}
        <BookFan />
        <Text
          accessibilityRole="header"
          className="font-display-sb text-lg text-text text-center italic p-5 leading-7"
        >
          {t('stitch.authUser.welcomeQuote')}
        </Text>
      </View>
      <View className="gap-3 mb-6">
        {[
          {
            Icon: BookOpen,
            title: t('stitch.authUser.personalLibrary'),
            body: t('stitch.authUser.personalLibraryBody')
          },
          {
            Icon: Compass,
            title: t('stitch.authUser.discover'),
            body: t('stitch.authUser.discoverBody')
          },
          {
            Icon: Users,
            title: t('stitch.authUser.readerCommunity'),
            body: t('stitch.authUser.readerCommunityBody')
          }
        ].map(({ Icon, title, body }) => (
          <View
            key={title}
            className="flex-row gap-4 bg-surface p-4 rounded-card"
          >
            <View className="h-11 w-11 items-center justify-center bg-sr rounded-full">
              <Icon size={22} color={c.text} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-body-sb text-sm text-text">{title}</Text>
              <Text className="font-body text-xs text-t2 leading-6">
                {body}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <Link href="/(auth)/register" asChild>
        <PrimaryButton>{t('stitch.authUser.createMine')}</PrimaryButton>
      </Link>
      <Link href="/(auth)/login" asChild>
        <Pressable className="min-h-12 items-center justify-center mt-2">
          <Text className="font-body-md text-text text-sm">
            {t('stitch.authUser.alreadySignIn')}
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
  )
}
